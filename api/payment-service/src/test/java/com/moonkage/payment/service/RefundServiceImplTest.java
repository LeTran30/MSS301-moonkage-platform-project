package com.moonkage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.request.RefundRequest;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.entity.PaymentAllocation;
import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.enums.PaymentStatus;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VnpayRefundClient;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.repository.PaymentAllocationRepository;
import com.moonkage.payment.repository.PaymentRepository;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.security.Role;
import com.moonkage.payment.service.impl.LedgerServiceImpl;
import com.moonkage.payment.service.impl.RefundServiceImpl;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * BE-02: money going back to a payer (AC-49.3, P-01, P-03).
 *
 * <p>The rules under test: a refund is asked once per (payment, reason); the ledger moves only when the money
 * really went back; a refund the gateway refuses waits for an admin and the escrow stays untouched.
 */
class RefundServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String PAYMENT_ID = "pay-1";
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);

    private final RefundRepository refundRepository = mock(RefundRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final PaymentAllocationRepository allocationRepository = mock(PaymentAllocationRepository.class);
    private final LedgerEntryRepository ledgerEntryRepository = mock(LedgerEntryRepository.class);
    private final LedgerRepository ledgerRepository = mock(LedgerRepository.class);
    private final OrderSnapshotRepository snapshotRepository = mock(OrderSnapshotRepository.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final VnpayRefundClient refundClient = mock(VnpayRefundClient.class);

    private RefundServiceImpl service;
    private Ledger ledger;

    @BeforeEach
    void setUp() {
        LedgerServiceImpl ledgerService =
                new LedgerServiceImpl(ledgerRepository, ledgerEntryRepository, snapshotRepository);
        service = new RefundServiceImpl(
                refundRepository,
                paymentRepository,
                allocationRepository,
                ledgerEntryRepository,
                ledgerService,
                outboxService,
                refundClient,
                new TransactionTemplate(mock(PlatformTransactionManager.class)));

        ledger = new Ledger();
        ledger.setOrderId(ORDER_ID);
        ledger.setVendorId("vendor-1");
        ledger.setTotalCollected(3_000_000L);
        ledger.setHeld(3_000_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenAnswer(call -> call.getArgument(0));
        when(ledgerRepository.save(any(Ledger.class))).thenAnswer(call -> call.getArgument(0));
        when(refundRepository.save(any(Refund.class))).thenAnswer(call -> call.getArgument(0));
    }

    // ----- asking for a refund -----

    /** AC-49.3: one refund per payment and reason — a retry must not refund twice. */
    @Test
    void aSecondRequestForTheSamePaymentAndReasonChangesNothing() {
        when(refundRepository.existsByOriginalPaymentIdAndReason(PAYMENT_ID, RefundReason.LATE_PAYMENT))
                .thenReturn(true);

        service.requestAutomatic(PAYMENT_ID, RefundReason.LATE_PAYMENT, 500_000L);

        verify(refundRepository, never()).save(any(Refund.class));
    }

    @Test
    void aFirstRequestIsRecordedPending() {
        service.requestAutomatic(PAYMENT_ID, RefundReason.LATE_PAYMENT, 500_000L);

        ArgumentCaptor<Refund> refund = ArgumentCaptor.forClass(Refund.class);
        verify(refundRepository).save(refund.capture());
        assertEquals(RefundStatus.PENDING, refund.getValue().getStatus());
        assertEquals(500_000L, refund.getValue().getAmount());
        assertEquals(PAYMENT_ID, refund.getValue().getOriginalPaymentId());
    }

    /** A dispute refund belongs to an order and a dispute; it cannot be asked for a plain payment. */
    @Test
    void aDisputeRefundIsNeverAskedForAPaymentAlone() {
        assertThrows(
                IllegalArgumentException.class, () -> service.requestAutomatic(PAYMENT_ID, RefundReason.DISPUTE, 1L));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestForPayment(new RefundRequest(PAYMENT_ID, RefundReason.DISPUTE, 1L)));
        assertEquals(ErrorCode.INVALID_INPUT, error.getErrorCode());
    }

    @Test
    void aRefundOfAPaymentThatNeverTookMoneyIsRefused() {
        Payment pending = payment(PaymentStatus.PENDING);
        when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(pending));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestForPayment(new RefundRequest(PAYMENT_ID, RefundReason.LATE_PAYMENT, 100_000L)));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
    }

    @Test
    void aRefundAboveWhatWasPaidIsRefused() {
        Payment succeeded = payment(PaymentStatus.SUCCEEDED);
        when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(succeeded));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestForPayment(new RefundRequest(PAYMENT_ID, RefundReason.LATE_PAYMENT, 5_000_000L)));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
    }

    /** FR-49: a dispute refund goes through the payment that brought the order's money. */
    @Test
    void aDisputeRefundUsesThePaymentOfTheOrder() {
        when(ledgerEntryRepository.findByOrderIdAndKindOrderByCreatedAtDesc(ORDER_ID, LedgerEntryKind.COLLECT))
                .thenReturn(List.of(LedgerEntry.of(ORDER_ID, LedgerEntryKind.COLLECT, 3_000_000L, PAYMENT_ID, null)));

        service.requestForDispute(ORDER_ID, "dispute-1", 1_000_000L);

        ArgumentCaptor<Refund> refund = ArgumentCaptor.forClass(Refund.class);
        verify(refundRepository).save(refund.capture());
        assertEquals(ORDER_ID, refund.getValue().getOrderId());
        assertEquals("dispute-1", refund.getValue().getDisputeId());
        assertEquals(PAYMENT_ID, refund.getValue().getOriginalPaymentId());
        assertEquals(1_000_000L, refund.getValue().getAmount());
    }

    /** One refund per dispute: the same dispute may not refund twice. */
    @Test
    void aSecondRefundOfTheSameDisputeChangesNothing() {
        when(refundRepository.existsByDisputeId("dispute-1")).thenReturn(true);

        service.requestForDispute(ORDER_ID, "dispute-1", 1_000_000L);

        verify(refundRepository, never()).save(any(Refund.class));
    }

    /** An order with no payment has nothing to refund; it is logged, not guessed. */
    @Test
    void aDisputeOfAnOrderWithoutAPaymentIsNotRefunded() {
        when(ledgerEntryRepository.findByOrderIdAndKindOrderByCreatedAtDesc(ORDER_ID, LedgerEntryKind.COLLECT))
                .thenReturn(List.of());

        service.requestForDispute(ORDER_ID, "dispute-1", 1_000_000L);

        verify(refundRepository, never()).save(any(Refund.class));
    }

    // ----- sending the refund to the gateway -----

    @Test
    void aRefundTheGatewayAcceptsMovesTheLedgerAndIsAnnounced() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(true, "VNP-1", null));

        service.processPending();

        assertEquals(RefundStatus.SUCCEEDED, refund.getStatus());
        assertEquals("VNP-1", refund.getGatewayRefundRef());
        assertEquals(2_000_000L, ledger.getHeld());
        assertEquals(1_000_000L, ledger.getRefunded());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.REFUND_COMPLETED_ROUTING_KEY), any());
    }

    @Test
    void aRefundTheGatewayRefusesWaitsForAnAdminAndTheEscrowStays() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(false, null, "VNPay answered 94"));

        service.processPending();

        assertEquals(RefundStatus.MANUAL_REQUIRED, refund.getStatus());
        assertEquals("VNPay answered 94", refund.getError());
        assertEquals(3_000_000L, ledger.getHeld());
        assertEquals(0L, ledger.getRefunded());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.REFUND_MANUAL_REQUIRED_ROUTING_KEY), any());
    }

    /** Q-01: more than the platform still holds is never sent to the gateway. */
    @Test
    void aRefundAboveWhatIsHeldIsNeverSentToTheGateway() {
        ledger.setHeld(500_000L);
        ledger.setDisbursed(2_500_000L);
        Refund refund = pendingDisputeRefund(1_000_000L);

        service.processPending();

        assertEquals(RefundStatus.MANUAL_REQUIRED, refund.getStatus());
        verify(refundClient, never()).refund(anyString(), any(), any(), anyLong(), anyLong(), anyString());
        assertEquals(500_000L, ledger.getHeld());
    }

    /** A refund of a whole payment gives each order back what the payment brought it (BR-29). */
    @Test
    void aWholePaymentRefundGivesEachOrderBackItsShare() {
        Payment payment = payment(PaymentStatus.SUCCEEDED);
        when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(payment));
        when(allocationRepository.findByPaymentId(PAYMENT_ID))
                .thenReturn(List.of(
                        new PaymentAllocation(PAYMENT_ID, "order-1", 1_000_000L),
                        new PaymentAllocation(PAYMENT_ID, "order-2", 2_000_000L)));
        // the second order has its own escrow; both still hold what the payment brought them
        Ledger other = ledgerOf("order-2", 2_000_000L);
        when(ledgerRepository.findForUpdateByOrderId("order-2")).thenReturn(Optional.of(other));
        when(ledgerRepository.findByOrderId("order-2")).thenReturn(Optional.of(other));
        Refund refund = Refund.automatic(PAYMENT_ID, RefundReason.LATE_PAYMENT, 3_000_000L);
        when(refundRepository.findForUpdateByStatus(eq(RefundStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(refund));
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(true, "VNP-2", null));

        service.processPending();

        assertEquals(RefundStatus.SUCCEEDED, refund.getStatus());
        assertEquals(2_000_000L, ledger.getHeld());
        assertEquals(1_000_000L, ledger.getRefunded());
        assertEquals(0L, other.getHeld());
        assertEquals(2_000_000L, other.getRefunded());
    }

    /** P-03: a duplicate payment never reached a ledger, so a refund of it moves nothing. */
    @Test
    void aDuplicatePaymentRefundMovesNoLedger() {
        when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(payment(PaymentStatus.SUCCEEDED)));
        Refund refund = Refund.automatic(PAYMENT_ID, RefundReason.DUPLICATE_PAYMENT, 500_000L);
        when(refundRepository.findForUpdateByStatus(eq(RefundStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(refund));
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(true, "VNP-3", null));

        service.processPending();

        assertEquals(RefundStatus.SUCCEEDED, refund.getStatus());
        assertEquals(3_000_000L, ledger.getHeld());
        assertEquals(0L, ledger.getRefunded());
        verify(ledgerEntryRepository, never()).save(any(LedgerEntry.class));
    }

    @Test
    void nothingToProcessChangesNothing() {
        when(refundRepository.findForUpdateByStatus(eq(RefundStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of());

        assertEquals(0, service.processPending());
        verifyNoInteractions(refundClient);
    }

    // ----- the admin finishes by hand -----

    @Test
    void anAdminConfirmsARefundByHandAndTheLedgerMoves() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        refund.setStatus(RefundStatus.MANUAL_REQUIRED);
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));

        var answer = service.confirmManual(ADMIN, refund.getId());

        assertEquals(RefundStatus.SUCCEEDED, answer.status());
        assertEquals(2_000_000L, ledger.getHeld());
        assertEquals(1_000_000L, ledger.getRefunded());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.REFUND_COMPLETED_ROUTING_KEY), any());
    }

    @Test
    void aRefundThatIsNotWaitingForAnAdminIsNotConfirmed() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));

        AppException error = assertThrows(AppException.class, () -> service.confirmManual(ADMIN, refund.getId()));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
    }

    @Test
    void anUnknownRefundIsNotFound() {
        when(refundRepository.findForUpdateById("refund-x")).thenReturn(Optional.empty());

        AppException error = assertThrows(AppException.class, () -> service.confirmManual(ADMIN, "refund-x"));

        assertEquals(ErrorCode.REFUND_NOT_FOUND, error.getErrorCode());
    }

    // ----- reading -----

    @Test
    void theRefundsOfAnOrderAreListedOldestFirst() {
        when(refundRepository.findByOrderIdOrderByCreatedAtAsc(ORDER_ID)).thenReturn(List.of());

        assertTrue(service.listForOrder(ORDER_ID).isEmpty());
    }

    private Refund pendingDisputeRefund(long amount) {
        Payment payment = payment(PaymentStatus.SUCCEEDED);
        when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(payment));
        Refund refund = Refund.dispute(ORDER_ID, "dispute-1", PAYMENT_ID, amount);
        when(refundRepository.findForUpdateByStatus(eq(RefundStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(refund));
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));
        return refund;
    }

    private static Payment payment(PaymentStatus status) {
        Payment payment = new Payment();
        payment.setId(PAYMENT_ID);
        payment.setGatewayTxnRef("txn-1");
        payment.setGatewayTxnNo("14000001");
        payment.setAmount(3_000_000L);
        payment.setStatus(status);
        payment.setCreatedAt(Instant.now());
        return payment;
    }

    private static Ledger ledgerOf(String orderId, long held) {
        Ledger ledger = new Ledger();
        ledger.setOrderId(orderId);
        ledger.setVendorId("vendor-1");
        ledger.setTotalCollected(held);
        ledger.setHeld(held);
        return ledger;
    }
}
