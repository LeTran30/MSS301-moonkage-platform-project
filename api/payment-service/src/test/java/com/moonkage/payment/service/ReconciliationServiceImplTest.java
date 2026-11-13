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
import static org.mockito.Mockito.when;

import com.moonkage.payment.client.OrderClient;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.request.CreateDisbursementRequest;
import com.moonkage.payment.dto.request.ReviewDisbursementRequest;
import com.moonkage.payment.dto.response.DisbursementResponse;
import com.moonkage.payment.dto.response.PayoutResponse;
import com.moonkage.payment.entity.DisbursementRequest;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import com.moonkage.payment.enums.WalletEntryReason;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.repository.DisbursementRequestRepository;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.repository.PayoutRepository;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.security.Role;
import com.moonkage.payment.service.impl.LedgerServiceImpl;
import com.moonkage.payment.service.impl.ReconciliationServiceImpl;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * BE-02: the money that leaves an order's escrow — a deposit disbursement (FR-41, FR-47) and a payout (FR-48).
 *
 * <p>Every test asserts the amounts, not only that nothing was thrown: a disbursement of the wrong size is a wrong
 * amount of real money.
 */
class ReconciliationServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);
    private static final CurrentUserInfo STRANGER = new CurrentUserInfo("someone-else", Role.MEMBER);

    private final LedgerRepository ledgerRepository = mock(LedgerRepository.class);
    private final LedgerEntryRepository ledgerEntryRepository = mock(LedgerEntryRepository.class);
    private final OrderSnapshotRepository snapshotRepository = mock(OrderSnapshotRepository.class);
    private final DisbursementRequestRepository disbursementRepository = mock(DisbursementRequestRepository.class);
    private final PayoutRepository payoutRepository = mock(PayoutRepository.class);
    private final RefundRepository refundRepository = mock(RefundRepository.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OrderClient orderClient = mock(OrderClient.class);
    private final RefundService refundService = mock(RefundService.class);
    private final WalletService walletService = mock(WalletService.class);
    private final WalletNotifier walletNotifier = mock(WalletNotifier.class);

    private ReconciliationServiceImpl service;
    private Ledger ledger;

    @BeforeEach
    void setUp() {
        TransactionTemplate tx = new TransactionTemplate(mock(PlatformTransactionManager.class));
        LedgerServiceImpl ledgerService =
                new LedgerServiceImpl(ledgerRepository, ledgerEntryRepository, snapshotRepository);
        service = new ReconciliationServiceImpl(
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
                tx,
                walletService,
                walletNotifier);

        ledger = new Ledger();
        ledger.setOrderId(ORDER_ID);
        ledger.setVendorId(VENDOR_ID);
        ledger.setTotalCollected(3_000_000L);
        ledger.setHeld(3_000_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
        when(vendorDirectory.ownedVendorId(STRANGER.accountId())).thenReturn(Optional.empty());
        when(vendorDirectory.ownerAccountId(VENDOR_ID)).thenReturn(OWNER.accountId());
        when(disbursementRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        when(payoutRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
    }

    // ----- FR-41: the vendor asks for part of the deposit -----

    @Test
    void aDisbursementRequestIsRecordedPendingAndAnnounced() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(customOrder()));

        DisbursementResponse answer = service.requestDisbursement(
                OWNER, ORDER_ID, new CreateDisbursementRequest(500_000L, DisbursementPurpose.MATERIALS));

        assertEquals(500_000L, answer.amount());
        assertEquals(DisbursementStatus.PENDING, answer.status());
        assertEquals(DisbursementPurpose.MATERIALS, answer.purpose());
        verify(disbursementRepository).saveAndFlush(any(DisbursementRequest.class));
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISBURSEMENT_REQUESTED_ROUTING_KEY), any());
        // asking is not paying: the escrow does not move
        assertEquals(3_000_000L, ledger.getHeld());
        assertEquals(0L, ledger.getDisbursed());
    }

    @Test
    void aDisbursementBeyondWhatIsHeldIsRefused() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(customOrder()));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(3_000_001L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_OVER_HELD, error.getErrorCode());
        verify(disbursementRepository, never()).saveAndFlush(any());
    }

    /** AC-41.2: what is already waiting for approval counts against the deposit held. */
    @Test
    void aWaitingDisbursementCountsAgainstTheDepositHeld() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(customOrder()));
        when(disbursementRepository.sumAmountByOrderIdAndStatus(ORDER_ID, DisbursementStatus.PENDING))
                .thenReturn(2_500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(600_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_OVER_HELD, error.getErrorCode());
        verify(disbursementRepository, never()).saveAndFlush(any());
    }

    @Test
    void aDisbursementOfAnOrderThatIsNotACustomOneIsRefused() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(snapshot("BUY_NOW")));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(100_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_NOT_ALLOWED, error.getErrorCode());
    }

    @Test
    void anOrderAlreadyPaidOutTakesNoDisbursement() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(customOrder()));
        when(payoutRepository.existsByOrderId(ORDER_ID)).thenReturn(true);

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestDisbursement(
                        OWNER, ORDER_ID, new CreateDisbursementRequest(100_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.DISBURSEMENT_NOT_ALLOWED, error.getErrorCode());
    }

    @Test
    void aShopThatDoesNotOwnTheOrderAsksNothing() {
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(customOrder()));

        AppException error = assertThrows(
                AppException.class,
                () -> service.requestDisbursement(
                        STRANGER, ORDER_ID, new CreateDisbursementRequest(100_000L, DisbursementPurpose.MATERIALS)));

        assertEquals(ErrorCode.LEDGER_NOT_FOUND, error.getErrorCode());
        verify(disbursementRepository, never()).saveAndFlush(any());
    }

    // ----- FR-47: an admin approves or rejects -----

    @Test
    void anApprovedDisbursementMovesTheLedgerAndRecordsTheAmount() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        DisbursementResponse answer = service.reviewDisbursement(
                ADMIN,
                ORDER_ID,
                request.getId(),
                new ReviewDisbursementRequest(DisbursementStatus.APPROVED, null, null));

        assertEquals(DisbursementStatus.APPROVED, answer.status());
        assertEquals(500_000L, answer.approvedAmount());
        assertEquals(2_500_000L, ledger.getHeld());
        assertEquals(500_000L, ledger.getDisbursed());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISBURSEMENT_REVIEWED_ROUTING_KEY), any());
        verify(walletService).credit(OWNER.accountId(), WalletEntryReason.DISBURSEMENT, 500_000L, request.getId());
    }

    /** AC-48.3: the admin may approve less than what was asked; only that much leaves the escrow. */
    @Test
    void aPartialApprovalMovesOnlyWhatWasApproved() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        DisbursementResponse answer = service.reviewDisbursement(
                ADMIN,
                ORDER_ID,
                request.getId(),
                new ReviewDisbursementRequest(DisbursementStatus.APPROVED, 200_000L, null));

        assertEquals(200_000L, answer.approvedAmount());
        assertEquals(2_800_000L, ledger.getHeld());
        assertEquals(200_000L, ledger.getDisbursed());
    }

    @Test
    void aRejectedDisbursementMovesNoMoneyAndSaysWhy() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        DisbursementResponse answer = service.reviewDisbursement(
                ADMIN,
                ORDER_ID,
                request.getId(),
                new ReviewDisbursementRequest(DisbursementStatus.REJECTED, null, "  Không đủ giấy tờ  "));

        assertEquals(DisbursementStatus.REJECTED, answer.status());
        assertEquals("Không đủ giấy tờ", answer.reason());
        assertEquals(3_000_000L, ledger.getHeld());
        assertEquals(0L, ledger.getDisbursed());
        verify(ledgerEntryRepository, never()).save(any(LedgerEntry.class));
    }

    @Test
    void aRejectionWithoutAReasonIsRefused() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> service.reviewDisbursement(
                        ADMIN,
                        ORDER_ID,
                        request.getId(),
                        new ReviewDisbursementRequest(DisbursementStatus.REJECTED, null, "  ")));

        assertEquals(ErrorCode.REASON_REQUIRED, error.getErrorCode());
        assertEquals(DisbursementStatus.PENDING, request.getStatus());
    }

    /** A request already decided is not decided twice: the money would leave the escrow twice. */
    @Test
    void aDecidedDisbursementIsNotDecidedAgain() {
        DisbursementRequest request = pendingDisbursement(500_000L);
        request.setStatus(DisbursementStatus.APPROVED);
        request.setApprovedAmount(500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> service.reviewDisbursement(
                        ADMIN,
                        ORDER_ID,
                        request.getId(),
                        new ReviewDisbursementRequest(DisbursementStatus.APPROVED, null, null)));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
    }

    /** More than the request may not be approved (AC-48.3). */
    @Test
    void anApprovalAboveTheRequestIsRefused() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> service.reviewDisbursement(
                        ADMIN,
                        ORDER_ID,
                        request.getId(),
                        new ReviewDisbursementRequest(DisbursementStatus.APPROVED, 600_000L, null)));

        assertEquals(ErrorCode.INVALID_INPUT, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
    }

    @Test
    void aVendorOwnerDoesNotDecideTheirOwnDisbursement() {
        DisbursementRequest request = pendingDisbursement(500_000L);

        AppException error = assertThrows(
                AppException.class,
                () -> service.reviewDisbursement(
                        OWNER,
                        ORDER_ID,
                        request.getId(),
                        new ReviewDisbursementRequest(DisbursementStatus.APPROVED, null, null)));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
        assertEquals(3_000_000L, ledger.getHeld());
    }

    // ----- FR-48: the payout -----

    @Test
    void aPayoutGivesTheVendorEverythingStillHeld() {
        ledger.setHeld(2_000_000L);
        ledger.setDisbursed(1_000_000L);

        PayoutResponse answer = service.payout(ADMIN, ORDER_ID);

        assertEquals(2_000_000L, answer.amount());
        assertEquals(VENDOR_ID, answer.vendorId());
        assertEquals(0L, ledger.getHeld());
        assertEquals(2_000_000L, ledger.getPaidOut());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.PAYOUT_COMPLETED_ROUTING_KEY), any());
        // the money lands in the Shop owner's wallet, whole (no commission)
        verify(walletService).credit(OWNER.accountId(), WalletEntryReason.SALE, 2_000_000L, ORDER_ID);
        verify(walletNotifier).notify(eq(OWNER.accountId()), anyString(), anyString(), eq(2_000_000L));
    }

    /** FR-48 without an admin: completed orders are paid out by the sweep; one that is not ready waits. */
    @Test
    void theSweepPaysOutCompletedOrdersAndSkipsTheOnesNotReady() {
        ledger.setHeld(2_000_000L);
        when(ledgerRepository.findCompletedNotPaidOut(any())).thenReturn(List.of(ORDER_ID, "order-2"));
        when(ledgerRepository.findByOrderId("order-2")).thenReturn(Optional.empty());

        assertEquals(1, service.payOutCompleted());

        verify(walletService).credit(OWNER.accountId(), WalletEntryReason.SALE, 2_000_000L, ORDER_ID);
        verify(walletService, never()).credit(anyString(), any(), anyLong(), eq("order-2"));
    }

    /** FR-48: the order is paid out once. */
    @Test
    void anOrderIsPaidOutOnlyOnce() {
        when(payoutRepository.existsByOrderId(ORDER_ID)).thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> service.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.ALREADY_PAID_OUT, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
        verify(payoutRepository, never()).saveAndFlush(any());
    }

    @Test
    void aPendingRefundHoldsThePayoutBack() {
        when(refundRepository.existsByOrderIdAndStatusIn(eq(ORDER_ID), any())).thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> service.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
    }

    @Test
    void aWaitingDisbursementHoldsThePayoutBack() {
        when(disbursementRepository.sumAmountByOrderIdAndStatus(ORDER_ID, DisbursementStatus.PENDING))
                .thenReturn(500_000L);

        AppException error = assertThrows(AppException.class, () -> service.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
    }

    @Test
    void anOrderWithoutALedgerIsNotPaidOut() {
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        AppException error = assertThrows(AppException.class, () -> service.payout(ADMIN, ORDER_ID));

        assertEquals(ErrorCode.LEDGER_NOT_FOUND, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
    }

    /** Only an admin pays the vendor out (FR-48). */
    @Test
    void aVendorOwnerDoesNotPayOutTheirOwnOrder() {
        AppException error = assertThrows(AppException.class, () -> service.payout(OWNER, ORDER_ID));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
        verify(orderClient, never()).lockForPayout(anyString());
    }

    // ----- reading the ledger -----

    @Test
    void aShopOwnerReadsItsOwnLedger() {
        var answer = service.get(OWNER, ORDER_ID);

        assertEquals(3_000_000L, answer.held());
        assertEquals(3_000_000L, answer.toReceive());
        assertEquals(VENDOR_ID, answer.vendorId());
    }

    /** The money of an order the caller may not see does not leak: not even that it exists. */
    @Test
    void aStrangerGetsNoLedger() {
        AppException error = assertThrows(AppException.class, () -> service.get(STRANGER, ORDER_ID));

        assertEquals(ErrorCode.LEDGER_NOT_FOUND, error.getErrorCode());
    }

    @Test
    void aPaidOutOrderShowsNothingLeftToReceive() {
        when(payoutRepository.existsByOrderId(ORDER_ID)).thenReturn(true);

        var answer = service.get(OWNER, ORDER_ID);

        assertEquals(0L, answer.toReceive());
        assertEquals(3_000_000L, answer.held());
    }

    @Test
    void everyMoneyMovementOfTheOrderIsListed() {
        when(ledgerEntryRepository.findByOrderIdOrderByCreatedAtAsc(ORDER_ID)).thenReturn(List.of());

        assertTrue(service.entries(OWNER, ORDER_ID).isEmpty());
    }

    private DisbursementRequest pendingDisbursement(long amount) {
        DisbursementRequest request = new DisbursementRequest();
        request.setId("req-1");
        request.setOrderId(ORDER_ID);
        request.setVendorId(VENDOR_ID);
        request.setAmount(amount);
        request.setPurpose(DisbursementPurpose.MATERIALS);
        request.setStatus(DisbursementStatus.PENDING);
        when(disbursementRepository.findForUpdate(ORDER_ID, request.getId())).thenReturn(Optional.of(request));
        return request;
    }

    private static OrderSnapshot customOrder() {
        return snapshot("CUSTOM_ORDER");
    }

    private static OrderSnapshot snapshot(String kind) {
        OrderSnapshot snapshot = new OrderSnapshot();
        snapshot.setOrderId(ORDER_ID);
        snapshot.setVendorId(VENDOR_ID);
        snapshot.setKind(kind);
        snapshot.setStatus("DEPOSITED");
        snapshot.setTotalAmount(3_000_000L);
        return snapshot;
    }
}
