package com.moonkage.quotation.service.impl;

import static com.moonkage.quotation.service.impl.Fixtures.BUYER;
import static com.moonkage.quotation.service.impl.Fixtures.DEADLINE;
import static com.moonkage.quotation.service.impl.Fixtures.NOW;
import static com.moonkage.quotation.service.impl.Fixtures.VENDOR;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.quotation.client.IdentityClient;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.dto.client.NfcStatusResponse;
import com.moonkage.quotation.dto.event.RequestCreatedEvent;
import com.moonkage.quotation.dto.request.CreateQuoteRequestRequest;
import com.moonkage.quotation.dto.request.DeliveryAddressRequest;
import com.moonkage.quotation.dto.response.QuoteRequestResponse;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.RequestInvitation;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.RequestType;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.repository.QuoteRequestRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import com.moonkage.quotation.service.OutboxService;
import java.time.Clock;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class QuoteRequestServiceImplTest {

    private static final NfcStatusResponse VERIFIED = new NfcStatusResponse("VERIFIED", "NGUYEN THI LAN", "x", NOW);

    @Mock
    private QuoteRequestRepository quoteRequestRepository;

    @Mock
    private RequestInvitationRepository requestInvitationRepository;

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private VendorSnapshotRepository vendorSnapshotRepository;

    @Mock
    private IdentityClient identityClient;

    @Mock
    private OutboxService outboxService;

    private QuoteRequestServiceImpl service;

    @BeforeEach
    void setUp() {
        VendorDirectory vendorDirectory = new VendorDirectory(vendorSnapshotRepository, new ObjectMapper());
        RequestAccessPolicy policy =
                new RequestAccessPolicy(quoteRequestRepository, requestInvitationRepository, vendorDirectory);
        service = new QuoteRequestServiceImpl(
                quoteRequestRepository,
                requestInvitationRepository,
                quoteRepository,
                vendorSnapshotRepository,
                vendorDirectory,
                policy,
                identityClient,
                outboxService,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void buyerWithoutVerifiedNfcCannotCreateARequest() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(new NfcStatusResponse("NOT_VERIFIED", null, null, null));

        assertError(() -> service.create(BUYER, body(RequestType.DIRECT, 100, Set.of())), ErrorCode.NFC_NOT_VERIFIED);
        verify(quoteRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void directRequestToTheBuyersOwnVendorIsRefused() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(vendorSnapshotRepository.findById(VENDOR)).thenReturn(Optional.of(Fixtures.vendor(VENDOR, BUYER)));

        assertError(() -> service.create(BUYER, body(RequestType.DIRECT, 100, Set.of())), ErrorCode.SELF_DEALING);
        verify(quoteRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void directRequestBelowTheVendorsMinimumShowsTheMinimum() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(vendorSnapshotRepository.findById(VENDOR))
                .thenReturn(Optional.of(Fixtures.vendor(VENDOR, Fixtures.OWNER)));

        assertThatThrownBy(() -> service.create(BUYER, body(RequestType.DIRECT, 10, Set.of())))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("50")
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.BELOW_MIN_QUANTITY);
    }

    @Test
    void directRequestToALockedOrUnpaidVendorIsRefused() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(vendorSnapshotRepository.findById(VENDOR))
                .thenReturn(Optional.of(Fixtures.set(Fixtures.vendor(VENDOR, Fixtures.OWNER), "canOperate", false)));

        assertError(
                () -> service.create(BUYER, body(RequestType.DIRECT, 100, Set.of())),
                ErrorCode.VENDOR_NOT_ACCEPTING_ORDERS);
    }

    @Test
    void openRequestInvitesOnlyMatchingVendorsAndNeverTheBuyersOwn() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(vendorSnapshotRepository.findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc())
                .thenReturn(List.of(
                        Fixtures.vendor("match", "o1"),
                        Fixtures.vendor("own", BUYER),
                        Fixtures.set(Fixtures.vendor("big-minimum", "o3"), "minQty", 500),
                        Fixtures.set(Fixtures.vendor("no-card", "o4"), "customCapabilities", List.of("BAG")),
                        Fixtures.set(Fixtures.vendor("hanoi-only", "o5"), "deliveryAreas", List.of("01"))));
        when(quoteRequestRepository.saveAndFlush(any())).thenAnswer(inv -> withId(inv.getArgument(0)));

        QuoteRequestResponse response = service.create(BUYER, body(RequestType.OPEN, 100, Set.of(CustomType.CARD)));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RequestInvitation>> invitations = ArgumentCaptor.forClass(List.class);
        verify(requestInvitationRepository).saveAll(invitations.capture());
        assertThat(invitations.getValue())
                .extracting(RequestInvitation::getVendorId)
                .containsExactly("match");
        assertThat(response.invitedCount()).isEqualTo(1);
        assertThat(response.targetVendorId()).isNull();
        verify(outboxService).enqueue(anyString(), eq(RequestCreatedEvent.ROUTING_KEY), any());
    }

    @Test
    void openRequestWithoutAnyMatchingVendorIsNotCreated() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(vendorSnapshotRepository.findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc())
                .thenReturn(List.of(Fixtures.vendor("own", BUYER)));

        assertError(() -> service.create(BUYER, body(RequestType.OPEN, 100, Set.of())), ErrorCode.NO_MATCHING_VENDOR);
        verify(quoteRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void unknownProvinceIsRefusedBeforeAnyRemoteCall() {
        CreateQuoteRequestRequest body = new CreateQuoteRequestRequest(
                RequestType.OPEN,
                null,
                null,
                100,
                null,
                Set.of(),
                null,
                DEADLINE,
                new DeliveryAddressRequest("Lan", "0901000001", "99", "12 Lê Lợi"));

        assertError(() -> service.create(BUYER, body), ErrorCode.INVALID_PROVINCE);
        verify(identityClient, never()).getNfcStatus(anyString());
    }

    private static CreateQuoteRequestRequest body(RequestType type, int quantity, Set<CustomType> customTypes) {
        return new CreateQuoteRequestRequest(
                type,
                type == RequestType.DIRECT ? VENDOR : null,
                null,
                quantity,
                null,
                customTypes,
                null,
                DEADLINE,
                new DeliveryAddressRequest("Nguyễn Thị Lan", "0901000001", "79", "12 Lê Lợi"));
    }

    private static QuoteRequest withId(QuoteRequest request) {
        ReflectionTestUtils.setField(request, "id", "request-1");
        return request;
    }

    private static void assertError(Runnable call, ErrorCode expected) {
        assertThatThrownBy(call::run)
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(expected);
    }
}
