package com.moonkage.quotation.service.impl;

import static com.moonkage.quotation.service.impl.Fixtures.BUYER;
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
import com.moonkage.quotation.client.IdentityClient;
import com.moonkage.quotation.client.PaymentClient;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.config.QuotationProperties;
import com.moonkage.quotation.dto.client.CreatePaymentRequest;
import com.moonkage.quotation.dto.client.CreatePaymentResponse;
import com.moonkage.quotation.dto.client.CreateRefundRequest;
import com.moonkage.quotation.dto.client.NfcStatusResponse;
import com.moonkage.quotation.dto.event.QuoteAcceptedEvent;
import com.moonkage.quotation.dto.response.AcceptQuoteResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteAcceptance;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceCopy;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceParties;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.QuoteStatus;
import com.moonkage.quotation.enums.RequestStatus;
import com.moonkage.quotation.enums.RequestType;
import com.moonkage.quotation.repository.QuoteAcceptanceRepository;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.repository.QuoteRequestRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import com.moonkage.quotation.service.OutboxService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
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
class QuoteAcceptanceServiceImplTest {

    private static final String REQUEST = "request-1";
    private static final Duration DEPOSIT_TIMEOUT = Duration.ofMinutes(15);
    private static final NfcStatusResponse VERIFIED =
            new NfcStatusResponse("VERIFIED", "NGUYEN THI LAN", "********0001", null, true);

    @Mock
    private QuoteAcceptanceRepository quoteAcceptanceRepository;

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private QuoteRequestRepository quoteRequestRepository;

    @Mock
    private RequestInvitationRepository requestInvitationRepository;

    @Mock
    private VendorSnapshotRepository vendorSnapshotRepository;

    @Mock
    private IdentityClient identityClient;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private OutboxService outboxService;

    private QuoteAcceptanceServiceImpl service;
    private QuoteRequest request;
    private Quote quote;

    @BeforeEach
    void setUp() {
        VendorDirectory vendorDirectory = new VendorDirectory(vendorSnapshotRepository, new ObjectMapper());
        RequestAccessPolicy policy =
                new RequestAccessPolicy(quoteRequestRepository, requestInvitationRepository, vendorDirectory);
        service = new QuoteAcceptanceServiceImpl(
                quoteAcceptanceRepository,
                quoteRepository,
                vendorDirectory,
                policy,
                identityClient,
                paymentClient,
                outboxService,
                new QuotationProperties(DEPOSIT_TIMEOUT),
                Clock.fixed(NOW, ZoneOffset.UTC));
        request = Fixtures.request(REQUEST, RequestType.OPEN, 100, Set.of());
        quote = Fixtures.quote("q1", REQUEST, VENDOR, null);
    }

    @Test
    void acceptFreezesABindingCopyAndChargesExactlyItsDeposit() {
        givenAcceptableQuote(OWNER);
        when(quoteAcceptanceRepository.saveAndFlush(any())).thenAnswer(inv -> withId(inv.getArgument(0)));
        when(paymentClient.createPayment(any())).thenReturn(new CreatePaymentResponse("pay-1", "https://vnpay/pay-1"));

        AcceptQuoteResponse response = service.accept(BUYER, REQUEST, "q1", null);

        ArgumentCaptor<CreatePaymentRequest> payment = ArgumentCaptor.forClass(CreatePaymentRequest.class);
        verify(paymentClient).createPayment(payment.capture());
        assertThat(payment.getValue().purpose()).isEqualTo(CreatePaymentRequest.DEPOSIT);
        assertThat(payment.getValue().referenceId()).isEqualTo("acc-1");
        assertThat(payment.getValue().amount()).isEqualTo(3_609_000);
        assertThat(response.depositAmount()).isEqualTo(3_609_000);
        assertThat(response.paymentUrl()).isEqualTo("https://vnpay/pay-1");
        assertThat(response.paymentExpiresAt()).isEqualTo(NOW.plus(DEPOSIT_TIMEOUT));

        ArgumentCaptor<QuoteAcceptance> saved = ArgumentCaptor.forClass(QuoteAcceptance.class);
        verify(quoteAcceptanceRepository).saveAndFlush(saved.capture());
        QuoteAcceptance acceptance = saved.getValue();
        assertThat(acceptance.getContentHash()).isEqualTo(AgreementHasher.sha256Hex(acceptance.getSnapshot()));
        assertThat(acceptance.getSnapshot())
                .contains("\"totalAmount\":12030000", "\"legalName\":\"NGUYEN THI LAN\"", "\"taxCode\":\"0312345678\"");
        assertThat(acceptance.getPaymentRef()).isEqualTo("pay-1");
    }

    @Test
    void depositDeadlineNeverOutlivesTheQuote() {
        ReflectionTestUtils.setField(quote, "validUntil", NOW.plus(Duration.ofMinutes(5)));
        givenAcceptableQuote(OWNER);
        when(quoteAcceptanceRepository.saveAndFlush(any())).thenAnswer(inv -> withId(inv.getArgument(0)));
        when(paymentClient.createPayment(any())).thenReturn(new CreatePaymentResponse("pay-1", "url"));

        AcceptQuoteResponse response = service.accept(BUYER, REQUEST, "q1", null);

        assertThat(response.paymentExpiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(5)));
    }

    @Test
    void acceptingAQuoteOfTheBuyersOwnVendorIsRefused() {
        givenAcceptableQuote(BUYER);

        assertError(() -> service.accept(BUYER, REQUEST, "q1", null), ErrorCode.SELF_DEALING);
        verify(paymentClient, never()).createPayment(any());
    }

    @Test
    void anExpiredQuoteCannotBeAccepted() {
        ReflectionTestUtils.setField(quote, "validUntil", NOW.minusSeconds(1));
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(quoteRequestRepository.findByIdForUpdate(REQUEST)).thenReturn(Optional.of(request));
        when(quoteRepository.findByIdAndRequestId("q1", REQUEST)).thenReturn(Optional.of(quote));

        assertError(() -> service.accept(BUYER, REQUEST, "q1", null), ErrorCode.QUOTE_NOT_ACCEPTABLE);
    }

    @Test
    void onlyOneDepositAtATimePerQuote() {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(quoteRequestRepository.findByIdForUpdate(REQUEST)).thenReturn(Optional.of(request));
        when(quoteRepository.findByIdAndRequestId("q1", REQUEST)).thenReturn(Optional.of(quote));
        when(quoteAcceptanceRepository.existsByQuoteIdAndStatus("q1", AcceptanceStatus.PENDING_PAYMENT))
                .thenReturn(true);

        assertError(() -> service.accept(BUYER, REQUEST, "q1", null), ErrorCode.ACCEPTANCE_IN_PROGRESS);
    }

    @Test
    void paidDepositAwardsTheRequestAndClosesTheOtherQuotes() {
        Quote other = Fixtures.quote("q2", REQUEST, "vendor-2", null);
        QuoteAcceptance acceptance = givenPendingAcceptance();
        when(quoteRepository.findById("q1")).thenReturn(Optional.of(quote));
        when(quoteRepository.findByRequestIdOrderBySubmittedAtAsc(REQUEST)).thenReturn(List.of(quote, other));

        Instant paidAt = NOW.plusSeconds(60);
        service.recordDepositPaid("acc-1", paidAt);

        assertThat(acceptance.getStatus()).isEqualTo(AcceptanceStatus.SUCCEEDED);
        assertThat(acceptance.getPaidAt()).isEqualTo(paidAt);
        assertThat(quote.getStatus()).isEqualTo(QuoteStatus.ACCEPTED);
        assertThat(other.getStatus()).isEqualTo(QuoteStatus.CLOSED);
        assertThat(request.getStatus()).isEqualTo(RequestStatus.AWARDED);
        verify(outboxService).enqueue(anyString(), eq(QuoteAcceptedEvent.ROUTING_KEY), any());
    }

    @Test
    void depositArrivingAfterTheAcceptanceExpiredIsRefunded() {
        QuoteAcceptance acceptance = givenPendingAcceptance();
        ReflectionTestUtils.setField(acceptance, "status", AcceptanceStatus.EXPIRED);
        when(quoteRepository.findById("q1")).thenReturn(Optional.of(quote));

        service.recordDepositPaid("acc-1", NOW.plusSeconds(60));

        verify(paymentClient).createRefund(CreateRefundRequest.quoteExpired("pay-1", 3_609_000));
        assertThat(request.getStatus()).isEqualTo(RequestStatus.OPEN);
        assertThat(quote.getStatus()).isEqualTo(QuoteStatus.SUBMITTED);
        verify(outboxService, never()).enqueue(anyString(), anyString(), any());
    }

    private void givenAcceptableQuote(String vendorOwner) {
        when(identityClient.getNfcStatus(BUYER)).thenReturn(VERIFIED);
        when(quoteRequestRepository.findByIdForUpdate(REQUEST)).thenReturn(Optional.of(request));
        when(quoteRepository.findByIdAndRequestId("q1", REQUEST)).thenReturn(Optional.of(quote));
        when(quoteAcceptanceRepository.existsByQuoteIdAndStatus("q1", AcceptanceStatus.PENDING_PAYMENT))
                .thenReturn(false);
        when(vendorSnapshotRepository.findById(VENDOR)).thenReturn(Optional.of(Fixtures.vendor(VENDOR, vendorOwner)));
    }

    private QuoteAcceptance givenPendingAcceptance() {
        AcceptanceParties parties = new AcceptanceParties("NGUYEN THI LAN", "********0001", "Tiệm", "0312345678", null);
        QuoteAcceptance acceptance = withId(QuoteAcceptance.pending(
                quote, BUYER, parties, new AcceptanceCopy("{}", "0".repeat(64), NOW.plus(DEPOSIT_TIMEOUT)), NOW));
        acceptance.attachPayment("pay-1");
        when(quoteAcceptanceRepository.findRequestIdById("acc-1")).thenReturn(Optional.of(REQUEST));
        when(quoteRequestRepository.findByIdForUpdate(REQUEST)).thenReturn(Optional.of(request));
        when(quoteAcceptanceRepository.findById("acc-1")).thenReturn(Optional.of(acceptance));
        when(quoteRequestRepository.findById(REQUEST)).thenReturn(Optional.of(request));
        return acceptance;
    }

    private static QuoteAcceptance withId(QuoteAcceptance acceptance) {
        ReflectionTestUtils.setField(acceptance, "id", "acc-1");
        return acceptance;
    }

    private static void assertError(Runnable call, ErrorCode expected) {
        assertThatThrownBy(call::run)
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(expected);
    }
}
