package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.order.client.PaymentClient;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.QuoteAcceptedEvent;
import com.moonkage.order.dto.request.UpdateOrderRequest;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.MockupReviewStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.MockupVersionRepository;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.repository.ProgressUpdateRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.OrderServiceImpl;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OrderServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
    private final MockupVersionRepository mockupVersionRepository = mock(MockupVersionRepository.class);
    private final ProgressUpdateRepository progressUpdateRepository = mock(ProgressUpdateRepository.class);
    private final InboxService inboxService = mock(InboxService.class);
    private final OrderEventPublisher orderEvents = mock(OrderEventPublisher.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final EntityManager entityManager = mock(EntityManager.class);

    private OrderServiceImpl service;
    private Order order;

    @BeforeEach
    void setUp() {
        service = new OrderServiceImpl(
                orderRepository,
                orderItemRepository,
                mockupVersionRepository,
                progressUpdateRepository,
                inboxService,
                orderEvents,
                vendorDirectory,
                mock(PaymentClient.class),
                new OrderProperties(),
                entityManager,
                mock(OrderFileService.class));
        order = new Order();
        order.setId(ORDER_ID);
        order.setKind(OrderKind.BUY_NOW);
        order.setStatus(OrderStatus.PAID);
        order.setBuyerAccountId(BUYER.accountId());
        order.setVendorId(VENDOR_ID);
        order.setItemsAmount(200_000L);
        order.setTotalAmount(230_000L);
        when(orderRepository.findForUpdateById(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderId(ORDER_ID)).thenReturn(List.of());
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
        when(vendorDirectory.ownedVendorId(BUYER.accountId())).thenReturn(Optional.empty());
    }

    @Test
    void theVendorMovesABuyNowOrderOneStepAndItIsRecorded() {
        service.update(OWNER, ORDER_ID, step(OrderStatus.CONFIRMED, null));

        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        verify(progressUpdateRepository).save(any());
        verify(orderEvents).announce(RabbitConfig.ORDER_STATUS_CHANGED_ROUTING_KEY, order);
    }

    @Test
    void aStepCannotBeSkipped() {
        AppException error = assertThrows(
                AppException.class, () -> service.update(OWNER, ORDER_ID, step(OrderStatus.DELIVERED, null)));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
        assertEquals(OrderStatus.PAID, order.getStatus());
    }

    @Test
    void onlyTheOwnerOfTheShopMovesTheOrder() {
        AppException error = assertThrows(
                AppException.class, () -> service.update(BUYER, ORDER_ID, step(OrderStatus.CONFIRMED, null)));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
    }

    @Test
    void anInterprovinceOrderShipsOnlyWithATrackingCode() {
        order.setInterprovince(true);
        order.setStatus(OrderStatus.CONFIRMED);

        AppException error = assertThrows(
                AppException.class, () -> service.update(OWNER, ORDER_ID, step(OrderStatus.SHIPPING, " ")));
        assertEquals(ErrorCode.TRACKING_CODE_REQUIRED, error.getErrorCode());

        service.update(OWNER, ORDER_ID, step(OrderStatus.SHIPPING, " VN123 "));
        assertEquals("VN123", order.getTrackingCode());
    }

    @Test
    void deliveryStartsTheComplaintWindowAndIsAnnounced() {
        order.setStatus(OrderStatus.SHIPPING);
        Instant before = Instant.now();

        service.update(OWNER, ORDER_ID, step(OrderStatus.DELIVERED, null));

        assertNotNull(order.getDeliveredAt());
        assertTrue(!order.getComplaintDeadline().isBefore(before.plus(Duration.ofDays(3))));
        assertTrue(order.getComplaintDeadline().isBefore(before.plus(Duration.ofDays(4))));
        verify(orderEvents).announce(RabbitConfig.ORDER_DELIVERED_ROUTING_KEY, order);
    }

    @Test
    void customWorkGoesToProductionOnlyAfterAnApprovedMockup() {
        order.setKind(OrderKind.CUSTOM_ORDER);
        order.setHasCustom(true);
        order.setStatus(OrderStatus.AWAITING_MOCKUP_APPROVAL);
        when(mockupVersionRepository.existsByOrderIdAndReviewStatus(ORDER_ID, MockupReviewStatus.APPROVED))
                .thenReturn(false);

        AppException error = assertThrows(
                AppException.class, () -> service.update(OWNER, ORDER_ID, step(OrderStatus.IN_PRODUCTION, null)));
        assertEquals(ErrorCode.MOCKUP_NOT_APPROVED, error.getErrorCode());

        when(mockupVersionRepository.existsByOrderIdAndReviewStatus(ORDER_ID, MockupReviewStatus.APPROVED))
                .thenReturn(true);
        service.update(OWNER, ORDER_ID, step(OrderStatus.IN_PRODUCTION, null));
        assertEquals(OrderStatus.IN_PRODUCTION, order.getStatus());
    }

    @Test
    void theBuyerConfirmsReceiptAndTheBuyNowOrderIsCompleted() {
        order.setStatus(OrderStatus.DELIVERED);

        service.update(BUYER, ORDER_ID, new UpdateOrderRequest(null, null, null, true, null));

        assertNotNull(order.getReceivedConfirmedAt());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(orderEvents).announce(RabbitConfig.ORDER_RECEIVED_CONFIRMED_ROUTING_KEY, order);
    }

    @Test
    void anAcceptedQuoteBecomesACustomOrderUnderTheAcceptanceId() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        service.createFromQuote(quoteAccepted());

        ArgumentCaptor<Order> created = ArgumentCaptor.forClass(Order.class);
        verify(entityManager).persist(created.capture());
        Order custom = created.getValue();
        assertEquals("acceptance-1", custom.getId());
        assertEquals(OrderKind.CUSTOM_ORDER, custom.getKind());
        assertEquals(OrderStatus.DEPOSITED, custom.getStatus());
        assertTrue(custom.isHasCustom());
        assertEquals(12_150_000L, custom.getItemsAmount());
        assertEquals(12_300_000L, custom.getTotalAmount());
        assertEquals(3_690_000L, custom.getDepositAmount());
        assertEquals("hash", custom.getAgreementHash());
        assertEquals("CTY ABC", custom.getInvoiceInfo().getInvoiceName());
        verify(orderItemRepository).save(any());
        verify(orderEvents).announce(RabbitConfig.ORDER_CREATED_ROUTING_KEY, custom);
    }

    @Test
    void aRepeatedQuoteAcceptedChangesNothing() {
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);

        service.createFromQuote(quoteAccepted());

        verify(entityManager, never()).persist(any());
    }

    private static UpdateOrderRequest step(OrderStatus status, String trackingCode) {
        return new UpdateOrderRequest(status, trackingCode, null, null, null);
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
                "acceptance-1",
                "quote-1",
                "request-1",
                BUYER.accountId(),
                VENDOR_ID,
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
