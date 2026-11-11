package com.moonkage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.DisputeEvent;
import com.moonkage.payment.dto.event.OrderEvent;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.service.impl.OrderEventServiceImpl;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * BE-02: what payment-service keeps from order-service's events (AC-43.1, AC-43.3, FR-49).
 *
 * <p>The rules under test: an older version of an order never overwrites a newer one; a dispute holds the money
 * (no expected payout date); a resolved dispute with a refund asks for the refund exactly once.
 */
class OrderEventServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderSnapshotRepository snapshotRepository = mock(OrderSnapshotRepository.class);
    private final InboxService inboxService = mock(InboxService.class);
    private final RefundService refundService = mock(RefundService.class);
    private final LedgerService ledgerService = mock(LedgerService.class);
    private final WalletService walletService = mock(WalletService.class);

    private OrderEventServiceImpl service;
    private OrderSnapshot snapshot;

    @BeforeEach
    void setUp() {
        service = new OrderEventServiceImpl(
                snapshotRepository, inboxService, ledgerService, refundService, walletService);
        snapshot = new OrderSnapshot();
        snapshot.setOrderId(ORDER_ID);
        snapshot.setVendorId(VENDOR_ID);
        snapshot.setKind("BUY_NOW");
        snapshot.setStatus("PAID");
        snapshot.setTotalAmount(230_000L);
        snapshot.setSourceVersion(0L);
        when(snapshotRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(snapshot));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
    }

    @Test
    void anOrderEventFillsTheSnapshot() {
        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(3L));

        assertEquals(ORDER_ID, snapshot.getOrderId());
        assertEquals(VENDOR_ID, snapshot.getVendorId());
        assertEquals("BUY_NOW", snapshot.getKind());
        assertEquals("DELIVERED", snapshot.getStatus());
        assertEquals(230_000L, snapshot.getTotalAmount());
        assertEquals(3L, snapshot.getSourceVersion());
    }

    /** Q-01: a Shop rejecting a paid order sends that order's money to the buyer's wallet. */
    @Test
    void aRejectedOrderIsRefundedToTheBuyersWallet() {
        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(2L, null, "REJECTED"));

        verify(walletService).refundRejectedOrder(ORDER_ID, "buyer-1");
    }

    @Test
    void anyOtherStatusLeavesTheWalletAlone() {
        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(2L));

        verify(walletService, never()).refundRejectedOrder(anyString(), anyString());
    }

    /** The same event twice changes nothing (NFR-05). */
    @Test
    void aRepeatedOrderEventChangesNothing() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);

        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(4L));

        verify(snapshotRepository, never()).save(any());
    }

    /** An older version of an order never overwrites a newer one. */
    @Test
    void anOlderVersionOfTheOrderIsSkipped() {
        snapshot.setSourceVersion(3L);

        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(2L));

        verify(snapshotRepository, never()).save(any());
        assertEquals(3L, snapshot.getSourceVersion());
    }

    @Test
    void aNewerVersionOfTheOrderIsApplied() {
        snapshot.setSourceVersion(3L);

        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(4L));

        ArgumentCaptor<OrderSnapshot> saved = ArgumentCaptor.forClass(OrderSnapshot.class);
        verify(snapshotRepository).save(saved.capture());
        assertEquals(4L, saved.getValue().getSourceVersion());
    }

    /** AC-43.1: the day the complaint window closes is when the money may be paid out. */
    @Test
    void anOrderWithAComplaintWindowHasAnExpectedPayoutDate() {
        Instant deadline = Instant.parse("2026-11-20T03:00:00Z");

        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(3L, deadline));

        verify(ledgerService).describe(ORDER_ID, VENDOR_ID, LocalDate.ofInstant(deadline, VIETNAM));
    }

    /** AC-43.1: an order without a complaint window has no day to be paid out. */
    @Test
    void anOrderWithoutAComplaintWindowHasNoExpectedPayoutDate() {
        service.onOrderEvent(RabbitConfig.ORDER_EVENTS_QUEUE, orderEvent(3L));

        verify(ledgerService).describe(ORDER_ID, VENDOR_ID, null);
    }

    /** BR-18: a dispute holds the money; there is no day it may be paid out. */
    @Test
    void anOpenDisputeHoldsTheMoney() {
        service.onDisputeOpened(disputeEvent("dispute-1", null));

        assertTrue(snapshot.isDisputeOpen());
        verify(ledgerService).describe(ORDER_ID, VENDOR_ID, null);
    }

    @Test
    void aResolvedDisputeReleasesTheMoney() {
        snapshot.setDisputeOpen(true);

        service.onDisputeResolved(disputeEvent("dispute-2", null));

        assertTrue(!snapshot.isDisputeOpen());
    }

    /** FR-49: a dispute that ends with money back asks for the refund, once. */
    @Test
    void aResolvedDisputeWithARefundAsksForTheRefund() {
        service.onDisputeResolved(disputeEvent("dispute-3", 100_000L));

        verify(refundService).requestForDispute(ORDER_ID, "dispute-3", 100_000L);
    }

    /** A rejected dispute gives nothing back, so no refund is asked for. */
    @Test
    void aResolvedDisputeWithoutARefundAsksForNothing() {
        service.onDisputeResolved(disputeEvent("dispute-4", null));

        verify(refundService, never()).requestForDispute(anyString(), anyString(), anyLong());
    }

    /** The same dispute event twice asks for the refund only once. */
    @Test
    void aRepeatedDisputeEventAsksForTheRefundOnce() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);

        service.onDisputeResolved(disputeEvent("dispute-5", 100_000L));

        verify(refundService, never()).requestForDispute(anyString(), anyString(), anyLong());
    }

    private static OrderEvent orderEvent(long version) {
        return orderEvent(version, null);
    }

    private static OrderEvent orderEvent(long version, Instant complaintDeadline) {
        return orderEvent(version, complaintDeadline, "DELIVERED");
    }

    private static OrderEvent orderEvent(long version, Instant complaintDeadline, String status) {
        return new OrderEvent(
                "evt-1",
                ORDER_ID,
                "BUY_NOW",
                status,
                "buyer-1",
                VENDOR_ID,
                230_000L,
                false,
                complaintDeadline,
                false,
                version,
                Instant.now());
    }

    private static DisputeEvent disputeEvent(String disputeId, Long refundAmount) {
        return new DisputeEvent(
                "evt-1",
                disputeId,
                ORDER_ID,
                VENDOR_ID,
                "buyer-1",
                "DAMAGED",
                "RESOLVED",
                refundAmount == null ? "REJECTED" : "FULL_REFUND",
                refundAmount,
                "admin-1",
                Instant.now());
    }
}
