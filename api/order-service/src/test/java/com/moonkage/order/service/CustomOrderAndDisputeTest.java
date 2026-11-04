package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.observability.MoneyMetrics;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.QuoteAcceptedEvent;
import com.moonkage.order.dto.request.ResolveDisputeRequest;
import com.moonkage.order.entity.Dispute;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
import com.moonkage.order.enums.DisputeDecision;
import com.moonkage.order.enums.DisputeStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.DisputeEvidenceRepository;
import com.moonkage.order.repository.DisputeRepository;
import com.moonkage.order.repository.MockupVersionRepository;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.repository.ProgressUpdateRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.DisputeServiceImpl;
import com.moonkage.order.service.impl.OrderServiceImpl;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * BE-02: a custom order from an accepted quote (FR-19, D-12) and the dispute that may hold its money (FR-12, FR-49).
 *
 * <p>The rules under test: one acceptance creates exactly one order with the agreed amounts; the same event twice
 * creates no second order; one open dispute per order; a dispute and a payout never pass each other (P-02).
 */
class CustomOrderAndDisputeTest {

    private static final String ORDER_ID = "order-1";
    private static final String ACCEPTANCE_ID = "acceptance-1";
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
    private final MockupVersionRepository mockupVersionRepository = mock(MockupVersionRepository.class);
    private final ProgressUpdateRepository progressUpdateRepository = mock(ProgressUpdateRepository.class);
    private final InboxService inboxService = mock(InboxService.class);
    private final OrderEventPublisher orderEvents = mock(OrderEventPublisher.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final DisputeRepository disputeRepository = mock(DisputeRepository.class);
    private final DisputeEvidenceRepository evidenceRepository = mock(DisputeEvidenceRepository.class);
    private final OutboxService outboxService = mock(OutboxService.class);

    private OrderServiceImpl orderService;
    private DisputeServiceImpl disputeService;
    private Order order;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(
                orderRepository,
                orderItemRepository,
                mockupVersionRepository,
                progressUpdateRepository,
                inboxService,
                orderEvents,
                vendorDirectory,
                mock(com.moonkage.order.client.PaymentClient.class),
                new com.moonkage.order.config.OrderProperties(),
                entityManager,
                mock(OrderFileService.class),
                new MoneyMetrics(new SimpleMeterRegistry()));
        disputeService = new DisputeServiceImpl(
                disputeRepository,
                evidenceRepository,
                orderRepository,
                new OrderAccess(orderRepository, vendorDirectory),
                mock(OrderFileService.class),
                outboxService);

        order = new Order();
        order.setId(ORDER_ID);
        order.setKind(OrderKind.BUY_NOW);
        order.setStatus(OrderStatus.DELIVERED);
        order.setBuyerAccountId(BUYER.accountId());
        order.setVendorId("vendor-1");
        order.setItemsAmount(200_000L);
        order.setShippingFee(30_000L);
        order.setTotalAmount(230_000L);
        order.setDeliveredAt(Instant.now().minus(Duration.ofDays(1)));
        order.setComplaintDeadline(Instant.now().plus(Duration.ofDays(2)));
        when(orderRepository.findForUpdateById(ORDER_ID)).thenReturn(Optional.of(order));
        when(vendorDirectory.ownedVendorId(anyString())).thenReturn(Optional.empty());
        when(disputeRepository.saveAndFlush(any(Dispute.class))).thenAnswer(call -> call.getArgument(0));
    }

    // ----- FR-19: an accepted quote becomes one custom order -----

    @Test
    void anAcceptedQuoteBecomesOneCustomOrderWithTheAgreedAmounts() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        ArgumentCaptor<Order> created = ArgumentCaptor.forClass(Order.class);
        verify(entityManager, times(1)).persist(created.capture());
        Order custom = created.getValue();
        assertEquals(ACCEPTANCE_ID, custom.getId());
        assertEquals(OrderKind.CUSTOM_ORDER, custom.getKind());
        assertEquals(OrderStatus.DEPOSITED, custom.getStatus());
        assertEquals("quote-1", custom.getQuoteId());
        assertEquals(ACCEPTANCE_ID, custom.getAgreementId());
        assertEquals("hash", custom.getAgreementHash());
        // the order's money is the agreed one
        assertEquals(12_150_000L, custom.getItemsAmount());
        assertEquals(150_000L, custom.getShippingFee());
        assertEquals(0L, custom.getDiscountAmount());
        assertEquals(12_300_000L, custom.getTotalAmount());
        assertEquals(3_690_000L, custom.getDepositAmount());
        assertEquals(8_610_000L, custom.getRemainingAmount());
        // the deposit plus the rest is the whole
        assertEquals(custom.getTotalAmount(), custom.getDepositAmount() + custom.getRemainingAmount());
    }

    @Test
    void anAcceptedQuoteCarriesTheDeliveryAndTheInvoice() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        ArgumentCaptor<Order> created = ArgumentCaptor.forClass(Order.class);
        verify(entityManager).persist(created.capture());
        Order custom = created.getValue();
        assertEquals("Chị Lan", custom.getRecipientName());
        assertEquals("0901234567", custom.getRecipientPhone());
        assertEquals("79", custom.getDeliveryProvinceCode());
        assertEquals("Quận 7", custom.getDeliveryAddressDetail());
        assertEquals(LocalDate.of(2026, 9, 5), custom.getDeliveryDate());
        assertEquals("Xe của xưởng", custom.getDeliveryMethod());
        assertEquals("CTY ABC", custom.getInvoiceInfo().getInvoiceName());
        assertEquals("ke-toan@abc.vn", custom.getInvoiceInfo().getInvoiceEmail());
    }

    /** BR-15: an order with custom work waits for an approved mockup; one without goes straight to production. */
    @Test
    void anOrderWithCustomWorkIsMarkedSo() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        ArgumentCaptor<Order> created = ArgumentCaptor.forClass(Order.class);
        verify(entityManager).persist(created.capture());
        assertTrue(created.getValue().isHasCustom());
    }

    /** The lines of the quote become the items of the order. */
    @Test
    void theLinesOfTheQuoteBecomeTheItemsOfTheOrder() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        ArgumentCaptor<OrderItem> items = ArgumentCaptor.forClass(OrderItem.class);
        verify(orderItemRepository).save(items.capture());
        assertEquals("Bánh nướng thập cẩm", items.getValue().getProductName());
        assertEquals(81_000L, items.getValue().getUnitPrice());
        assertEquals(150, items.getValue().getQuantity());
        assertEquals(12_150_000L, items.getValue().getSubtotal());
    }

    /** The same event twice creates no second order (NFR-05: RabbitMQ delivers at least once). */
    @Test
    void aRepeatedQuoteAcceptedCreatesNoSecondOrder() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);

        orderService.createFromQuote(quoteAccepted());

        verify(entityManager, never()).persist(any());
        verify(orderItemRepository, never()).save(any());
    }

    /** An order that already exists under the acceptance id is not created again. */
    @Test
    void anOrderThatAlreadyExistsIsNotCreatedAgain() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(orderRepository.existsById(ACCEPTANCE_ID)).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        verify(entityManager, never()).persist(any());
    }

    /** The order of a quote is announced, so the other services learn about it. */
    @Test
    void theNewOrderIsAnnounced() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        orderService.createFromQuote(quoteAccepted());

        ArgumentCaptor<Order> announced = ArgumentCaptor.forClass(Order.class);
        verify(orderEvents).announce(eq(RabbitConfig.ORDER_CREATED_ROUTING_KEY), announced.capture());
        assertEquals(ACCEPTANCE_ID, announced.getValue().getId());
        assertEquals(OrderKind.CUSTOM_ORDER, announced.getValue().getKind());
    }

    // ----- FR-12: a dispute holds the money -----

    @Test
    void theBuyerOpensADisputeAndTheMoneyIsHeld() {
        disputeService.open(BUYER, ORDER_ID, damaged());

        verify(disputeRepository).saveAndFlush(any(Dispute.class));
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISPUTE_OPENED_ROUTING_KEY), any());
    }

    /** ux_disputes_one_open_per_order: one open dispute per order. */
    @Test
    void aSecondDisputeOfTheSameOrderIsRefused() {
        when(disputeRepository.existsByOrderIdAndStatus(ORDER_ID, DisputeStatus.OPEN))
                .thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> disputeService.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.DISPUTE_ALREADY_OPEN, error.getErrorCode());
        verify(disputeRepository, never()).saveAndFlush(any());
    }

    /** AC-12.2: a complaint after the window is closed is refused. */
    @Test
    void noDisputeAfterTheComplaintDeadline() {
        order.setComplaintDeadline(Instant.now().minusSeconds(1));

        AppException error = assertThrows(AppException.class, () -> disputeService.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.COMPLAINT_WINDOW_CLOSED, error.getErrorCode());
    }

    /** AC-12.2: a complaint before the order was delivered is refused. */
    @Test
    void noDisputeBeforeTheOrderWasDelivered() {
        order.setDeliveredAt(null);
        order.setComplaintDeadline(null);

        AppException error = assertThrows(AppException.class, () -> disputeService.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.COMPLAINT_WINDOW_CLOSED, error.getErrorCode());
    }

    /** P-02: once the payout is locked, no dispute may open. */
    @Test
    void noDisputeOnceThePayoutIsLocked() {
        order.setPayoutLockedAt(Instant.now());

        AppException error = assertThrows(AppException.class, () -> disputeService.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.PAYOUT_LOCKED, error.getErrorCode());
        verify(disputeRepository, never()).saveAndFlush(any());
    }

    /** P-02: an order still inside its window cannot be locked for payout. */
    @Test
    void anOrderStillInItsWindowCannotBeLockedForPayout() {
        AppException error = assertThrows(AppException.class, () -> disputeService.lockForPayout(ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        assertNull(order.getPayoutLockedAt());
    }

    /** P-02: an order with an open dispute cannot be locked for payout. */
    @Test
    void anOrderWithAnOpenDisputeCannotBeLockedForPayout() {
        order.setReceivedConfirmedAt(Instant.now());
        when(disputeRepository.existsByOrderIdAndStatus(ORDER_ID, DisputeStatus.OPEN))
                .thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> disputeService.lockForPayout(ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
        assertNull(order.getPayoutLockedAt());
    }

    /** P-02: the lock is taken once; asking again answers the same lock. */
    @Test
    void aReceivedOrderIsLockedOnceAndTheLockIsAnsweredAgain() {
        order.setReceivedConfirmedAt(Instant.now());

        Instant locked = disputeService.lockForPayout(ORDER_ID).payoutLockedAt();

        assertNotNull(locked);
        assertEquals(locked, disputeService.lockForPayout(ORDER_ID).payoutLockedAt());
    }

    /** Past the complaint deadline, the order may be paid out. */
    @Test
    void anOrderPastItsComplaintWindowMayBePaidOut() {
        order.setComplaintDeadline(Instant.now().minusSeconds(1));

        Instant locked = disputeService.lockForPayout(ORDER_ID).payoutLockedAt();

        assertNotNull(locked);
    }

    // ----- FR-49: the admin decides -----

    @Test
    void aFullRefundDecisionGivesBackTheOrderTotal() {
        Dispute open = openDispute();

        disputeService.resolve(
                ADMIN, ORDER_ID, new ResolveDisputeRequest(DisputeDecision.FULL_REFUND, null, "Ảnh rõ ràng"));

        assertEquals(DisputeStatus.RESOLVED, open.getStatus());
        assertEquals(230_000L, open.getRefundAmount());
        assertEquals(DisputeDecision.FULL_REFUND, open.getDecision());
        assertEquals(ADMIN.accountId(), open.getDecidedBy());
        assertNotNull(open.getResolvedAt());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISPUTE_RESOLVED_ROUTING_KEY), any());
    }

    @Test
    void aPartialRefundDecisionGivesBackTheDecidedAmount() {
        Dispute open = openDispute();

        disputeService.resolve(
                ADMIN, ORDER_ID, new ResolveDisputeRequest(DisputeDecision.PARTIAL_REFUND, 100_000L, "Một phần hỏng"));

        assertEquals(100_000L, open.getRefundAmount());
    }

    /** AC-49.1: a partial refund is more than 0 and less than the order total. */
    @Test
    void aPartialRefundOfTheWholeOrderIsRefused() {
        Dispute open = openDispute();

        AppException error = assertThrows(
                AppException.class,
                () -> disputeService.resolve(
                        ADMIN,
                        ORDER_ID,
                        new ResolveDisputeRequest(DisputeDecision.PARTIAL_REFUND, 230_000L, "Hết hàng")));

        assertEquals(ErrorCode.REFUND_AMOUNT_INVALID, error.getErrorCode());
        assertEquals(DisputeStatus.OPEN, open.getStatus());
    }

    @Test
    void aPartialRefundOfNothingIsRefused() {
        Dispute open = openDispute();

        AppException error = assertThrows(
                AppException.class,
                () -> disputeService.resolve(
                        ADMIN, ORDER_ID, new ResolveDisputeRequest(DisputeDecision.PARTIAL_REFUND, 0L, "Hết hàng")));

        assertEquals(ErrorCode.REFUND_AMOUNT_INVALID, error.getErrorCode());
    }

    /** A rejected complaint gives nothing back. */
    @Test
    void aRejectedDisputeGivesNothingBack() {
        Dispute open = openDispute();

        disputeService.resolve(ADMIN, ORDER_ID, new ResolveDisputeRequest(DisputeDecision.REJECTED, null, "Hàng tốt"));

        assertEquals(DisputeStatus.RESOLVED, open.getStatus());
        assertNull(open.getRefundAmount());
    }

    // ----- helpers -----

    private Dispute openDispute() {
        Dispute open = new Dispute();
        open.setId("dispute-1");
        open.setOrder(order);
        open.setBuyerAccountId(BUYER.accountId());
        open.setReason(com.moonkage.order.enums.DisputeReason.DAMAGED);
        open.setDescription("Bánh bị vỡ");
        open.setStatus(DisputeStatus.OPEN);
        when(disputeRepository.findFirstByOrderIdOrderByCreatedAtDesc(ORDER_ID)).thenReturn(Optional.of(open));
        return open;
    }

    private static com.moonkage.order.dto.request.OpenDisputeRequest damaged() {
        return new com.moonkage.order.dto.request.OpenDisputeRequest(
                com.moonkage.order.enums.DisputeReason.DAMAGED, "Hộp bánh bị móp, bánh vỡ", List.of());
    }

    private static QuoteAcceptedEvent quoteAccepted() {
        QuoteAcceptedEvent.QuotePart quote = new QuoteAcceptedEvent.QuotePart(
                "quote-1",
                List.of(new QuoteAcceptedEvent.LinePart(
                        1, "Bánh nướng thập cẩm", "product-1", 150, 81_000L, 12_150_000L)),
                12_000_000L,
                150_000L,
                150_000L,
                12_300_000L,
                3_690_000L,
                8_610_000L,
                LocalDate.of(2026, 9, 5),
                "Xe của xưởng");
        return new QuoteAcceptedEvent(
                "evt-1",
                Instant.now(),
                ACCEPTANCE_ID,
                "quote-1",
                "request-1",
                BUYER.accountId(),
                "vendor-1",
                3_690_000L,
                "payment-1",
                "hash",
                new QuoteAcceptedEvent.Snapshot(
                        new QuoteAcceptedEvent.RequestPart("product-1", 150, List.of("BAG")),
                        quote,
                        new QuoteAcceptedEvent.DeliveryPart("Chị Lan", "0901234567", "79", "Quận 7"),
                        new QuoteAcceptedEvent.InvoicePart("CTY ABC", "0312345678", "Quận 7", "ke-toan@abc.vn")));
    }
}
