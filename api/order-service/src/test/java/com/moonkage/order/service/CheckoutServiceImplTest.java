package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.observability.MoneyMetrics;
import com.moonkage.order.client.CatalogClient;
import com.moonkage.order.client.PaymentClient;
import com.moonkage.order.client.VendorClient;
import com.moonkage.order.client.dto.CreatePaymentRequest;
import com.moonkage.order.client.dto.CreatePaymentResponse;
import com.moonkage.order.client.dto.ProductSnapshotResponse;
import com.moonkage.order.client.dto.ProductSnapshotResponse.ProductPart;
import com.moonkage.order.client.dto.ProductSnapshotResponse.VendorPart;
import com.moonkage.order.client.dto.RefundRequest;
import com.moonkage.order.client.dto.StockReservationResponse;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.dto.request.CreateCheckoutRequest;
import com.moonkage.order.entity.CartItem;
import com.moonkage.order.entity.Checkout;
import com.moonkage.order.entity.CheckoutGroup;
import com.moonkage.order.entity.CheckoutLine;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
import com.moonkage.order.enums.CheckoutStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.CartItemRepository;
import com.moonkage.order.repository.CheckoutGroupRepository;
import com.moonkage.order.repository.CheckoutLineRepository;
import com.moonkage.order.repository.CheckoutRepository;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.CheckoutServiceImpl;
import feign.FeignException;
import feign.Request;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class CheckoutServiceImplTest {

    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CreateCheckoutRequest ADDRESS =
            new CreateCheckoutRequest("Anh Minh", "0901234567", "79", "12 Lê Lợi", null, null);

    private final CheckoutRepository checkoutRepository = mock(CheckoutRepository.class);
    private final CheckoutGroupRepository groupRepository = mock(CheckoutGroupRepository.class);
    private final CheckoutLineRepository lineRepository = mock(CheckoutLineRepository.class);
    private final OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
    private final CartItemRepository cartItemRepository = mock(CartItemRepository.class);
    private final InboxService inboxService = mock(InboxService.class);
    private final CatalogClient catalogClient = mock(CatalogClient.class);
    private final VendorClient vendorClient = mock(VendorClient.class);
    private final PaymentClient paymentClient = mock(PaymentClient.class);
    private final EntityManager entityManager = mock(EntityManager.class);

    private CheckoutServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CheckoutServiceImpl(
                checkoutRepository,
                groupRepository,
                lineRepository,
                cartItemRepository,
                orderItemRepository,
                inboxService,
                mock(OrderEventPublisher.class),
                catalogClient,
                vendorClient,
                paymentClient,
                new OrderProperties(),
                new TransactionTemplate(mock(PlatformTransactionManager.class)),
                entityManager,
                new MoneyMetrics(new SimpleMeterRegistry()));
        when(cartItemRepository.findByBuyerAccountIdOrderByCreatedAtAsc(BUYER.accountId()))
                .thenReturn(List.of(cartItem("p1", "v1", 2), cartItem("p2", "v2", 1)));
        when(checkoutRepository.findForUpdateById(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void oneCheckoutPaysEveryShopWithItsOwnDeliveryFeeAndOrderId() {
        when(catalogClient.snapshot(any())).thenReturn(snapshot(true));
        when(vendorClient.reserve(any()))
                .thenAnswer(call -> new StockReservationResponse(
                        "c",
                        "HELD",
                        Instant.now(),
                        List.of(
                                new StockReservationResponse.Item("p1", "v1", 2, 100_000L),
                                new StockReservationResponse.Item("p2", "v2", 1, 250_000L))));
        when(paymentClient.createPayment(anyString(), any()))
                .thenReturn(new CreatePaymentResponse("pay-1", "https://vnpay"));

        var answer = service.create(BUYER, ADDRESS);

        // v1: 200 000 + 30 000 local fee; v2: 250 000 + 45 000 interprovince fee
        assertEquals(525_000L, answer.totalAmount());
        assertEquals("https://vnpay", answer.paymentUrl());
        ArgumentCaptor<CreatePaymentRequest> payment = ArgumentCaptor.forClass(CreatePaymentRequest.class);
        verify(paymentClient).createPayment(eq(answer.checkoutId()), payment.capture());
        assertEquals(CreatePaymentRequest.CHECKOUT, payment.getValue().purpose());
        assertEquals(answer.checkoutId(), payment.getValue().referenceId());
        assertEquals(
                List.of(230_000L, 295_000L),
                payment.getValue().allocations().stream()
                        .map(CreatePaymentRequest.Allocation::amount)
                        .toList());
    }

    @Test
    void aShopThatDoesNotDeliverThereStopsTheCheckoutBeforeAnythingIsHeld() {
        when(catalogClient.snapshot(any())).thenReturn(snapshot(false));

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.NOT_DELIVERABLE, error.getErrorCode());
        verify(vendorClient, never()).reserve(any());
    }

    @Test
    void aFailedPaymentLinkReleasesTheStock() {
        when(catalogClient.snapshot(any())).thenReturn(snapshot(true));
        when(vendorClient.reserve(any()))
                .thenReturn(new StockReservationResponse(
                        "c",
                        "HELD",
                        Instant.now(),
                        List.of(new StockReservationResponse.Item("p1", "v1", 2, 100_000L))));
        when(paymentClient.createPayment(anyString(), any()))
                .thenThrow(new IllegalStateException("payment-service down"));

        assertThrows(IllegalStateException.class, () -> service.create(BUYER, ADDRESS));

        verify(vendorClient).release(anyString());
    }

    @Test
    void aPaymentAfterTheStockWasSoldIsRefundedAndCreatesNoOrder() {
        Checkout checkout = checkout(CheckoutStatus.EXPIRED);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(vendorClient.commit("c1")).thenThrow(conflict());

        service.onPaid("evt-1", "c1", "pay-1");

        verify(paymentClient).requestRefund(new RefundRequest("pay-1", RefundRequest.LATE_PAYMENT, 525_000L));
        assertEquals(CheckoutStatus.REFUND_REQUESTED, checkout.getStatus());
        verify(entityManager, never()).persist(any());
    }

    @Test
    void aPaidCheckoutBecomesOneOrderPerShopUnderTheIssuedIds() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(groupRepository.findByCheckoutId("c1")).thenReturn(List.of(group("v1", "o1"), group("v2", "o2")));
        when(lineRepository.findByCheckoutIdOrderByLineNo("c1")).thenReturn(List.of(line("v1", "products/v1/p1.jpg")));

        service.onPaid("evt-1", "c1", "pay-1");

        assertEquals(CheckoutStatus.SUCCEEDED, checkout.getStatus());
        // the order keeps the Shop's name and the cover image of the day, as the product name and price
        ArgumentCaptor<OrderItem> items = ArgumentCaptor.forClass(OrderItem.class);
        verify(orderItemRepository).save(items.capture());
        assertEquals("products/v1/p1.jpg", items.getValue().getImageKey());
        ArgumentCaptor<Order> orders = ArgumentCaptor.forClass(Order.class);
        verify(entityManager, times(2)).persist(orders.capture());
        assertEquals(
                List.of("o1", "o2"),
                orders.getAllValues().stream().map(Order::getId).toList());
        assertEquals("c1", orders.getValue().getPaymentGroupId());
        assertEquals("Shop v1", orders.getAllValues().getFirst().getVendorName());
        verify(cartItemRepository).deleteBought(eq(BUYER.accountId()), any());
    }

    private static ProductSnapshotResponse snapshot(boolean v2Delivers) {
        return new ProductSnapshotResponse(
                List.of(
                        new ProductPart(
                                "p1",
                                "v1",
                                "owner-1",
                                "Bánh nướng",
                                100_000L,
                                10,
                                null,
                                "LOCAL",
                                true,
                                "products/v1/p1.jpg"),
                        new ProductPart(
                                "p2", "v2", "owner-2", "Bánh dẻo", 250_000L, 10, null, "NATIONWIDE", true, null)),
                List.of(
                        new VendorPart("v1", "Tiệm A", true, false, 30_000L),
                        new VendorPart("v2", "Xưởng B", v2Delivers, true, v2Delivers ? 45_000L : null)));
    }

    private static CartItem cartItem(String productId, String vendorId, int quantity) {
        CartItem item = new CartItem();
        item.setBuyerAccountId(BUYER.accountId());
        item.setProductId(productId);
        item.setVendorId(vendorId);
        item.setQuantity(quantity);
        return item;
    }

    private static Checkout checkout(CheckoutStatus status) {
        Checkout checkout = new Checkout();
        checkout.setId("c1");
        checkout.setBuyerAccountId(BUYER.accountId());
        checkout.setRecipientName("Anh Minh");
        checkout.setRecipientPhone("0901234567");
        checkout.setProvinceCode("79");
        checkout.setAddressDetail("12 Lê Lợi");
        checkout.setTotalAmount(525_000L);
        checkout.setStatus(status);
        return checkout;
    }

    private static CheckoutGroup group(String vendorId, String orderId) {
        CheckoutGroup group = new CheckoutGroup();
        group.setCheckoutId("c1");
        group.setVendorId(vendorId);
        group.setVendorName("Shop " + vendorId);
        group.setOrderId(orderId);
        group.setItemsAmount(200_000L);
        group.setShippingFee(30_000L);
        return group;
    }

    private static CheckoutLine line(String vendorId, String imageKey) {
        CheckoutLine line = new CheckoutLine();
        line.setCheckoutId("c1");
        line.setLineNo(1);
        line.setVendorId(vendorId);
        line.setProductId("p1");
        line.setProductName("Bánh nướng");
        line.setImageKey(imageKey);
        line.setUnitPrice(100_000L);
        line.setQuantity(2);
        return line;
    }

    private static FeignException conflict() {
        Request request = Request.create(
                Request.HttpMethod.POST, "http://vendor-service", Map.of(), null, StandardCharsets.UTF_8, null);
        return new FeignException.Conflict("stock gone", request, null, null);
    }
}
