package com.moonkage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.payment.client.OrderClient;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.request.CreateDisbursementRequest;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.enums.PaymentStatus;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VnpayRefundClient;
import com.moonkage.payment.repository.DisbursementRequestRepository;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.repository.PaymentAllocationRepository;
import com.moonkage.payment.repository.PaymentRepository;
import com.moonkage.payment.repository.PayoutRepository;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.security.Role;
import com.moonkage.payment.service.impl.LedgerServiceImpl;
import com.moonkage.payment.service.impl.ReconciliationServiceImpl;
import com.moonkage.payment.service.impl.RefundServiceImpl;
import feign.FeignException;
import feign.Request;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** The ledger rules of NFR-09 and the services that move money through them (FR-41, FR-47, FR-48, FR-49). */
class MoneyFlowTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);

    private final LedgerRepository ledgerRepository = mock(LedgerRepository.class);
    private final LedgerEntryRepository ledgerEntryRepository = mock(LedgerEntryRepository.class);
    private final OrderSnapshotRepository snapshotRepository = mock(OrderSnapshotRepository.class);
    private final RefundRepository refundRepository = mock(RefundRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final DisbursementRequestRepository disbursementRepository = mock(DisbursementRequestRepository.class);
    private final PayoutRepository payoutRepository = mock(PayoutRepository.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final VnpayRefundClient refundClient = mock(VnpayRefundClient.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OrderClient orderClient = mock(OrderClient.class);
    private final TransactionTemplate tx = new TransactionTemplate(mock(PlatformTransactionManager.class));

    private LedgerServiceImpl ledgerService;
    private RefundServiceImpl refundService;
    private ReconciliationServiceImpl reconciliation;
    private Ledger ledger;

    @BeforeEach
    void setUp() {
        ledgerService = new LedgerServiceImpl(ledgerRepository, ledgerEntryRepository, snapshotRepository);
        refundService = new RefundServiceImpl(
                refundRepository,
                paymentRepository,
                mock(PaymentAllocationRepository.class),
                ledgerEntryRepository,
                ledgerService,
                outboxService,
                refundClient,
                tx);
        reconciliation = new ReconciliationServiceImpl(
                ledgerRepository,
                ledgerEntryRepository,
                snapshotRepository,
                disbursementRepository,
                payoutRepository,
                refundRepository,
                ledgerService,
                refundService,
                outboxService,
                vendorDirectory,
                orderClient,
                tx);
        ledger = new Ledger();
        ledger.setOrderId(ORDER_ID);
        ledger.setVendorId(VENDOR_ID);
        ledger.setTotalCollected(3_000_000L);
        ledger.setHeld(3_000_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
        when(disbursementRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        when(payoutRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void nothingLeavesALedgerBeyondWhatItHolds() {
        AppException error = assertThrows(
                AppException.class, () -> ledgerService.disburse(ORDER_ID, 3_000_001L, "req-1", "admin-1"));

        assertEquals(ErrorCode.LEDGER_INSUFFICIENT, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    void everyMovementKeepsHeldEqualToCollectedMinusWhatWentOut() {
        ledgerService.disburse(ORDER_ID, 1_000_000L, "req-1", "admin-1");
        ledgerService.refund(ORDER_ID, 500_000L, "refund-1", "admin-1");

        assertEquals(1_500_000L, ledger.getHeld());
        assertEquals(
                ledger.getTotalCollected() - ledger.getDisbursed() - ledger.getRefunded() - ledger.getPaidOut(),
                ledger.getHeld());
        ArgumentCaptor<LedgerEntry> entries = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, org.mockito.Mockito.times(2)).save(entries.capture());
        assertEquals(
                List.of(LedgerEntryKind.DISBURSE, LedgerEntryKind.REFUND),
                entries.getAllValues().stream().map(LedgerEntry::getKind).toList());
    }

    @Test
    void aDisputeRefundVnpayAcceptsMovesTheLedger() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(true, "VNP-1", null));

        refundService.processPending();

        assertEquals(RefundStatus.SUCCEEDED, refund.getStatus());
        assertEquals(2_000_000L, ledger.getHeld());
        assertEquals(1_000_000L, ledger.getRefunded());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.REFUND_COMPLETED_ROUTING_KEY), any());
    }

    @Test
    void aRefundVnpayRefusesWaitsForAnAdminAndTheLedgerStays() {
        Refund refund = pendingDisputeRefund(1_000_000L);
        when(refundClient.refund(anyString(), any(), any(), anyLong(), anyLong(), anyString()))
                .thenReturn(new VnpayRefundClient.RefundResult(false, null, "VNPay answered 94"));

        refundService.processPending();

        assertEquals(RefundStatus.MANUAL_REQUIRED, refund.getStatus());
        assertEquals(3_000_000L, ledger.getHeld());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.REFUND_MANUAL_REQUIRED_ROUTING_KEY), any());
    }

    @Test
    void aRefundAboveWhatIsHeldIsNeverSentToVnpay() {
        ledger.setHeld(500_000L);
        ledger.setDisbursed(2_500_000L);
        Refund refund = pendingDisputeRefund(1_000_000L);

        refundService.processPending();

        assertEquals(RefundStatus.MANUAL_REQUIRED, refund.getStatus());
        verify(refundClient, never()).refund(anyString(), any(), any(), anyLong(), anyLong(), anyString());
    }

    @Test
    void waitingDisbursementsCountAgainstTheDepositHeld() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(snapshot("CUSTOM_ORDER")));
        when(disbursementRepository.sumAmountByOrderIdAndStatus(ORDER_ID, DisbursementStatus.PENDING))
                .thenReturn(2_500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> reconciliation.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(600_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_OVER_HELD, error.getErrorCode());
    }

    @Test
    void onlyACustomOrderDepositIsDisbursed() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(snapshot("BUY_NOW")));

        AppException error = assertThrows(
                AppException.class,
                () -> reconciliation.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(100_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_NOT_ALLOWED, error.getErrorCode());
    }

    @Test
    void aPayoutOrderServiceRefusesToLockMovesNothing() {
        when(orderClient.lockForPayout(ORDER_ID)).thenThrow(conflict());

        AppException error = assertThrows(AppException.class, () -> reconciliation.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
        verify(payoutRepository, never()).saveAndFlush(any());
    }

    @Test
    void aPayoutGivesTheVendorEverythingStillHeld() {
        ledger.setHeld(2_000_000L);
        ledger.setDisbursed(1_000_000L);

        var payout = reconciliation.payout(ADMIN, ORDER_ID);

        assertEquals(2_000_000L, payout.amount());
        assertEquals(0L, ledger.getHeld());
        assertEquals(2_000_000L, ledger.getPaidOut());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.PAYOUT_COMPLETED_ROUTING_KEY), any());
    }

    @Test
    void aPendingRefundHoldsThePayoutBack() {
        when(refundRepository.existsByOrderIdAndStatusIn(eq(ORDER_ID), any())).thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> reconciliation.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
    }

    private Refund pendingDisputeRefund(long amount) {
        Payment payment = new Payment();
        payment.setId("pay-1");
        payment.setGatewayTxnRef("txn-1");
        payment.setAmount(3_000_000L);
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setCreatedAt(Instant.now());
        when(paymentRepository.findById("pay-1")).thenReturn(Optional.of(payment));
        Refund refund = Refund.dispute(ORDER_ID, "dispute-1", "pay-1", amount);
        when(refundRepository.findForUpdateByStatus(eq(RefundStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(refund));
        when(refundRepository.findForUpdateById(refund.getId())).thenReturn(Optional.of(refund));
        return refund;
    }

    private static OrderSnapshot snapshot(String kind) {
        OrderSnapshot snapshot = new OrderSnapshot();
        snapshot.setOrderId(ORDER_ID);
        snapshot.setVendorId(VENDOR_ID);
        snapshot.setKind(kind);
        return snapshot;
    }

    private static FeignException conflict() {
        Request request = Request.create(
                Request.HttpMethod.POST, "http://order-service", Map.of(), null, StandardCharsets.UTF_8, null);
        return new FeignException.Conflict("not eligible", request, null, null);
    }
}
