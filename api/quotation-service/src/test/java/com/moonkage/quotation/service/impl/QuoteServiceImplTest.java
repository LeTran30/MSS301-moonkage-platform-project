package com.moonkage.quotation.service.impl;

import static com.moonkage.quotation.service.impl.Fixtures.DEADLINE;
import static com.moonkage.quotation.service.impl.Fixtures.NOW;
import static com.moonkage.quotation.service.impl.Fixtures.OWNER;
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
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.dto.event.QuoteSubmittedEvent;
import com.moonkage.quotation.dto.request.CustomItemRequest;
import com.moonkage.quotation.dto.request.QuoteItemRequest;
import com.moonkage.quotation.dto.request.SubmitQuoteRequest;
import com.moonkage.quotation.dto.request.UpdateQuoteRequest;
import com.moonkage.quotation.dto.response.QuoteResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.RequestInvitation;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.InvitationStatus;
import com.moonkage.quotation.enums.QuoteStatus;
import com.moonkage.quotation.enums.RequestType;
import com.moonkage.quotation.repository.QuoteAcceptanceRepository;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.repository.QuoteRequestRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import com.moonkage.quotation.service.OutboxService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuoteServiceImplTest {

    private static final String REQUEST = "request-1";

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private QuoteAcceptanceRepository quoteAcceptanceRepository;

    @Mock
    private RequestInvitationRepository requestInvitationRepository;

    @Mock
    private QuoteRequestRepository quoteRequestRepository;

    @Mock
    private VendorSnapshotRepository vendorSnapshotRepository;

    @Mock
    private OutboxService outboxService;

    private QuoteServiceImpl service;
    private QuoteRequest request;
    private RequestInvitation invitation;

    @BeforeEach
    void setUp() {
        VendorDirectory vendorDirectory = new VendorDirectory(vendorSnapshotRepository, new ObjectMapper());
        RequestAccessPolicy policy =
                new RequestAccessPolicy(quoteRequestRepository, requestInvitationRepository, vendorDirectory);
        service = new QuoteServiceImpl(
                quoteRepository,
                quoteAcceptanceRepository,
                requestInvitationRepository,
                vendorDirectory,
                policy,
                outboxService,
                Clock.fixed(NOW, ZoneOffset.UTC));
        request = Fixtures.request(REQUEST, RequestType.OPEN, 100, Set.of(CustomType.BAG));
        invitation = RequestInvitation.of(REQUEST, VENDOR);
        when(vendorSnapshotRepository.findFirstByOwnerAccountId(OWNER))
                .thenReturn(Optional.of(Fixtures.vendor(VENDOR, OWNER)));
        when(quoteRequestRepository.findByIdForUpdate(REQUEST)).thenReturn(Optional.of(request));
    }

    @Test
    void serverComputesEveryAmountAndTheInvitationBecomesQuoted() {
        givenInvitedWithoutLiveQuote();
        when(quoteRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        QuoteResponse quote = service.submit(OWNER, REQUEST, body(null));

        assertThat(quote.itemsAmount()).isEqualTo(12_000_000);
        assertThat(quote.customSurcharge()).isEqualTo(500_000);
        assertThat(quote.totalAmount()).isEqualTo(12_530_000);
        assertThat(quote.depositAmount()).isEqualTo(3_759_000);
        assertThat(quote.remainingAmount()).isEqualTo(8_771_000);
        assertThat(quote.revisionNo()).isEqualTo(1);
        assertThat(quote.validUntil()).isEqualTo(NOW.plus(Duration.ofDays(7)));
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.QUOTED);
        verify(outboxService).enqueue(anyString(), eq(QuoteSubmittedEvent.ROUTING_KEY), any());
    }

    @Test
    void aSecondQuoteWithoutReplacingTheLiveOneIsRefused() {
        when(requestInvitationRepository.findByRequestIdAndVendorId(REQUEST, VENDOR))
                .thenReturn(Optional.of(invitation));
        when(quoteRepository.findByRequestIdAndVendorIdAndStatus(REQUEST, VENDOR, QuoteStatus.SUBMITTED))
                .thenReturn(Optional.of(Fixtures.quote("q1", REQUEST, VENDOR, null)));

        assertError(() -> service.submit(OWNER, REQUEST, body(null)), ErrorCode.QUOTE_ALREADY_SUBMITTED);
        verify(quoteRepository, never()).saveAndFlush(any());
    }

    @Test
    void aNewRevisionWithdrawsTheQuoteItReplaces() {
        Quote previous = Fixtures.quote("q1", REQUEST, VENDOR, null);
        when(requestInvitationRepository.findByRequestIdAndVendorId(REQUEST, VENDOR))
                .thenReturn(Optional.of(invitation));
        when(quoteRepository.findByRequestIdAndVendorIdAndStatus(REQUEST, VENDOR, QuoteStatus.SUBMITTED))
                .thenReturn(Optional.of(previous));
        when(quoteRepository.findByIdAndRequestId("q1", REQUEST)).thenReturn(Optional.of(previous));
        when(quoteRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        QuoteResponse revision = service.submit(OWNER, REQUEST, body("q1"));

        assertThat(revision.revisionNo()).isEqualTo(2);
        assertThat(revision.supersedesQuoteId()).isEqualTo("q1");
        assertThat(previous.getStatus()).isEqualTo(QuoteStatus.WITHDRAWN);
        assertThat(previous.getWithdrawnAt()).isEqualTo(NOW);
    }

    @Test
    void aQuoteWaitingForItsDepositCannotBeWithdrawn() {
        when(quoteRepository.findByIdAndRequestId("q1", REQUEST))
                .thenReturn(Optional.of(Fixtures.quote("q1", REQUEST, VENDOR, null)));
        when(quoteAcceptanceRepository.existsByQuoteIdAndStatus("q1", AcceptanceStatus.PENDING_PAYMENT))
                .thenReturn(true);

        assertError(
                () -> service.update(OWNER, REQUEST, "q1", new UpdateQuoteRequest(QuoteStatus.WITHDRAWN)),
                ErrorCode.QUOTE_LOCKED);
    }

    @Test
    void customLineOutsideTheRequestedCustomWorkIsRefused() {
        when(requestInvitationRepository.findByRequestIdAndVendorId(REQUEST, VENDOR))
                .thenReturn(Optional.of(invitation));
        SubmitQuoteRequest withCard = new SubmitQuoteRequest(
                List.of(new QuoteItemRequest("Hộp 4 bánh", null, 100, 120_000L)),
                List.of(new CustomItemRequest(CustomType.CARD, "Thiệp", 100, 2_000L)),
                30_000L,
                new BigDecimal("30"),
                DEADLINE,
                "Giao tận nơi",
                7,
                null,
                null);

        assertError(() -> service.submit(OWNER, REQUEST, withCard), ErrorCode.INVALID_QUOTE_LINES);
    }

    @Test
    void vendorWhoDeclinedCannotQuote() {
        invitation.decline("Hết công suất", NOW);
        when(requestInvitationRepository.findByRequestIdAndVendorId(REQUEST, VENDOR))
                .thenReturn(Optional.of(invitation));

        assertError(() -> service.submit(OWNER, REQUEST, body(null)), ErrorCode.INVITATION_DECLINED);
    }

    private void givenInvitedWithoutLiveQuote() {
        when(requestInvitationRepository.findByRequestIdAndVendorId(REQUEST, VENDOR))
                .thenReturn(Optional.of(invitation));
        when(quoteRepository.findByRequestIdAndVendorIdAndStatus(REQUEST, VENDOR, QuoteStatus.SUBMITTED))
                .thenReturn(Optional.empty());
    }

    /** 100 × 120.000đ + logo on bags 100 × 5.000đ + 30.000đ shipping, 30% deposit, valid 7 days. */
    private static SubmitQuoteRequest body(String supersedesQuoteId) {
        return new SubmitQuoteRequest(
                List.of(new QuoteItemRequest("Hộp 4 bánh", null, 100, 120_000L)),
                List.of(new CustomItemRequest(CustomType.BAG, "In logo túi", 100, 5_000L)),
                30_000L,
                new BigDecimal("30"),
                DEADLINE,
                "Giao tận nơi",
                7,
                null,
                supersedesQuoteId);
    }

    private static void assertError(Runnable call, ErrorCode expected) {
        assertThatThrownBy(call::run)
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(expected);
    }
}
