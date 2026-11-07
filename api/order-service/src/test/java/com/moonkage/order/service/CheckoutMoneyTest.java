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
import com.moonkage.order.enums.CheckoutStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * BE-02: the money of a checkout (BR-28, BR-29, BR-30, P-01).
 *
 * <p>A checkout may hold several shops at once. Each shop gets its own delivery fee and its own order, and the
 * payment asks exactly the sum of those parts. Every test asserts the amounts: a checkout that is off by one fee
 * charges the buyer the wrong price.
 */
class CheckoutMoneyTest {

    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CreateCheckoutRequest ADDRESS =
            new CreateCheckoutRequest("Anh Minh", "0901234567", "79", "12 Lê Lợi", null);

    private final CheckoutRepository checkoutRepository = mock(CheckoutRepository.class);
    private final CheckoutGroupRepository groupRepository = mock(CheckoutGroupRepository.class);
    private final CheckoutLineRepository lineRepository = mock(CheckoutLineRepository.class);
    private final CartItemRepository cartItemRepository = mock(CartItemRepository.class);
    private final OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
    private final InboxService inboxService = mock(InboxService.class);
    private final OrderEventPublisher orderEvents = mock(OrderEventPublisher.class);
    private final CatalogClient catalogClient = mock(CatalogClient.class);
    private final VendorClient vendorClient = mock(VendorClient.class);
    private final PaymentClient paymentClient = mock(PaymentClient.class);
    private final EntityManager entityManager = mock(EntityManager.class);

    /** The groups the checkout saved, so a test can see the order ids it issued. */
    private final List<CheckoutGroup> savedGroups = new ArrayList<>();

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
                orderEvents,
                catalogClient,
                vendorClient,
                paymentClient,
                new OrderProperties(),
                new TransactionTemplateHolder().template(),
                entityManager,
                new MoneyMetrics(new SimpleMeterRegistry()));
        when(checkoutRepository.findForUpdateById(anyString())).thenReturn(Optional.empty());
        when(groupRepository.saveAll(any())).thenAnswer(call -> {
            List<CheckoutGroup> saved = new ArrayList<>();
            for (CheckoutGroup group : (Iterable<CheckoutGroup>) call.getArgument(0)) {
                saved.add(group);
            }
            savedGroups.addAll(saved);
            return saved;
        });
    }

    // ----- what the checkout asks the buyer to pay -----

    @Test
    void oneCheckoutPaysEveryShopWithItsOwnDeliveryFeeAndOrderId() {
        givenCart(cartItem("p1", "v1", 2), cartItem("p2", "v2", 1));
        givenSnapshot();
        givenStockHeld();
        givenPayment();

        var answer = service.create(BUYER, ADDRESS);

        // v1: 2 x 100 000 + 30 000 local fee = 230 000; v2: 1 x 250 000 + 45 000 interprovince = 295 000
        assertEquals(525_000L, answer.totalAmount());
        ArgumentCaptor<CreatePaymentRequest> payment = ArgumentCaptor.forClass(CreatePaymentRequest.class);
        verify(paymentClient).createPayment(eq(answer.checkoutId()), payment.capture());
        assertEquals(525_000L, payment.getValue().amount());
        assertEquals(
                List.of(230_000L, 295_000L),
                payment.getValue().allocations().stream()
                        .map(CreatePaymentRequest.Allocation::amount)
                        .toList());
    }
    /** BR-29: each part of the payment names the order it becomes, so the money can be split when it arrives. */
    @Test
    void everyPartOfThePaymentNamesTheOrderItBecomes() {
        givenCart(cartItem("p1", "v1", 2), cartItem("p2", "v2", 1));
        givenSnapshot();
        givenStockHeld();
        givenPayment();

        var answer = service.create(BUYER, ADDRESS);

        List<String> orderIds =
                savedGroups.stream().map(CheckoutGroup::getOrderId).toList();
        ArgumentCaptor<CreatePaymentRequest> payment = ArgumentCaptor.forClass(CreatePaymentRequest.class);
        verify(paymentClient).createPayment(eq(answer.checkoutId()), payment.capture());
        assertEquals(
                orderIds,
                payment.getValue().allocations().stream()
                        .map(CreatePaymentRequest.Allocation::orderId)
                        .toList());
        // one order per shop, never one per product
        assertEquals(2, orderIds.size());
        assertEquals(2, orderIds.stream().distinct().count());
    }

    /** Two products of the same shop are one order with one delivery fee. */
    @Test
    void twoProductsOfTheSameShopShareOneDeliveryFee() {
        givenCart(cartItem("p1", "v1", 2), cartItem("p3", "v1", 1));
        givenSnapshot();
        when(vendorClient.reserve(any()))
                .thenAnswer(call -> new StockReservationResponse(
                        "c",
                        "HELD",
                        Instant.now(),
                        List.of(
                                new StockReservationResponse.Item("p1", "v1", 2, 100_000L),
                                new StockReservationResponse.Item("p3", "v1", 1, 50_000L))));
        givenPayment();

        var answer = service.create(BUYER, ADDRESS);

        // 2 x 100 000 + 1 x 50 000 + one fee of 30 000
        assertEquals(280_000L, answer.totalAmount());
        assertEquals(1, savedGroups.size());
        assertEquals(30_000L, savedGroups.get(0).getShippingFee());
    }

    // ----- what stops a checkout -----

    @Test
    void anEmptyCartIsNoCheckout() {
        when(cartItemRepository.findByBuyerAccountIdOrderByCreatedAtAsc(BUYER.accountId()))
                .thenReturn(List.of());

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.CART_EMPTY, error.getErrorCode());
        verify(paymentClient, never()).createPayment(anyString(), any());
    }

    /** BR-22: the owner of a shop may not buy its own products. */
    @Test
    void theOwnerOfTheShopMayNotBuyItsOwnProduct() {
        givenCart(cartItem("p1", "v1", 1));
        when(catalogClient.snapshot(any())).thenReturn(snapshot(BUYER.accountId()));

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.OWN_PRODUCT, error.getErrorCode());
        verify(vendorClient, never()).reserve(any());
    }

    @Test
    void aProductThatIsNotOnSaleStopsTheCheckout() {
        givenCart(cartItem("p1", "v1", 1));
        when(catalogClient.snapshot(any())).thenReturn(snapshot(null, false, true));

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.PRODUCT_NOT_AVAILABLE, error.getErrorCode());
        verify(vendorClient, never()).reserve(any());
    }

    /** BR-30: a shop that does not deliver to the province stops the whole checkout. */
    @Test
    void aShopThatDoesNotDeliverThereStopsTheCheckoutBeforeAnythingIsHeld() {
        givenCart(cartItem("p1", "v1", 2), cartItem("p2", "v2", 1));
        when(catalogClient.snapshot(any())).thenReturn(snapshot(null, false));

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.NOT_DELIVERABLE, error.getErrorCode());
        verify(vendorClient, never()).reserve(any());
    }

    /** BR-28: the stock that could not be held stops the checkout; nothing is asked for payment. */
    @Test
    void stockThatCannotBeHeldStopsTheCheckout() {
        givenCart(cartItem("p1", "v1", 2));
        when(catalogClient.snapshot(any())).thenReturn(snapshot(null));
        when(vendorClient.reserve(any())).thenThrow(conflict());

        AppException error = assertThrows(AppException.class, () -> service.create(BUYER, ADDRESS));

        assertEquals(ErrorCode.STOCK_UNAVAILABLE, error.getErrorCode());
        verify(paymentClient, never()).createPayment(anyString(), any());
    }

    /** A payment that cannot be created releases the stock that was held for it. */
    @Test
    void aFailedPaymentLinkReleasesTheStock() {
        givenCart(cartItem("p1", "v1", 2));
        givenSnapshot();
        givenStockHeld();
        when(paymentClient.createPayment(anyString(), any()))
                .thenThrow(new IllegalStateException("payment-service down"));

        assertThrows(IllegalStateException.class, () -> service.create(BUYER, ADDRESS));

        verify(vendorClient).release(anyString());
    }

    // ----- what happens when the money arrives -----

    /** BR-29: one paid checkout becomes one order per shop, under the ids issued with the checkout. */
    @Test
    void aPaidCheckoutBecomesOneOrderPerShopUnderTheIssuedIds() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(groupRepository.findByCheckoutId("c1")).thenReturn(List.of(group("v1", "o1"), group("v2", "o2")));

        service.onPaid("evt-1", "c1", "pay-1");

        assertEquals(CheckoutStatus.SUCCEEDED, checkout.getStatus());
        ArgumentCaptor<Order> orders = ArgumentCaptor.forClass(Order.class);
        verify(entityManager, times(2)).persist(orders.capture());
        assertEquals(
                List.of("o1", "o2"),
                orders.getAllValues().stream().map(Order::getId).toList());
        assertEquals(
                List.of("v1", "v2"),
                orders.getAllValues().stream().map(Order::getVendorId).toList());
        assertEquals(
                List.of(OrderKind.BUY_NOW, OrderKind.BUY_NOW),
                orders.getAllValues().stream().map(Order::getKind).toList());
        assertEquals(
                List.of(OrderStatus.PAID, OrderStatus.PAID),
                orders.getAllValues().stream().map(Order::getStatus).toList());
        assertEquals("c1", orders.getValue().getPaymentGroupId());
    }

    /** The order of a shop carries that shop's part of the money, not the whole checkout. */
    @Test
    void everyOrderCarriesItsOwnShopPartOfTheMoney() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(groupRepository.findByCheckoutId("c1")).thenReturn(List.of(group("v1", "o1"), group("v2", "o2")));

        service.onPaid("evt-1", "c1", "pay-1");

        ArgumentCaptor<Order> orders = ArgumentCaptor.forClass(Order.class);
        verify(entityManager, times(2)).persist(orders.capture());
        assertEquals(230_000L, orders.getAllValues().get(0).getTotalAmount());
        assertEquals(295_000L, orders.getAllValues().get(1).getTotalAmount());
        assertEquals(200_000L, orders.getAllValues().get(0).getItemsAmount());
        assertEquals(30_000L, orders.getAllValues().get(0).getShippingFee());
        assertEquals(0L, orders.getAllValues().get(0).getDiscountAmount());
    }

    /** The bought products leave the cart. */
    @Test
    void theBoughtProductsLeaveTheCart() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);
        when(groupRepository.findByCheckoutId("c1")).thenReturn(List.of(group("v1", "o1")));
        when(lineRepository.findByCheckoutIdOrderByLineNo("c1")).thenReturn(List.of(line(1, "v1", "p1")));

        service.onPaid("evt-1", "c1", "pay-1");

        verify(cartItemRepository).deleteBought(eq(BUYER.accountId()), eq(List.of("p1")));
    }

    /** P-01: a payment after the stock was sold is refunded and creates no order. */
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

    /** The same event twice does not create the orders twice. */
    @Test
    void aRepeatedPaymentEventCreatesNoSecondOrder() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);
        when(groupRepository.findByCheckoutId("c1")).thenReturn(List.of(group("v1", "o1")));

        service.onPaid("evt-1", "c1", "pay-1");

        verify(entityManager, never()).persist(any());
        assertEquals(CheckoutStatus.PENDING_PAYMENT, checkout.getStatus());
    }

    /** A checkout that already succeeded answers a repeated event with nothing. */
    @Test
    void aSettledCheckoutChangesNothingOnARepeatedEvent() {
        Checkout checkout = checkout(CheckoutStatus.SUCCEEDED);
        when(checkoutRepository.findById("c1")).thenReturn(Optional.of(checkout));

        service.onPaid("evt-1", "c1", "pay-1");

        verify(entityManager, never()).persist(any());
        verify(vendorClient, never()).commit(anyString());
    }

    // ----- what happens when the payment fails -----

    @Test
    void aDeclinedPaymentFailsTheCheckoutAndReleasesTheStock() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(true);

        service.onPaymentFailed("evt-1", "c1");

        assertEquals(CheckoutStatus.FAILED, checkout.getStatus());
        verify(vendorClient).release("c1");
    }

    @Test
    void aDeclinedPaymentOfAnotherCheckoutChangesNothing() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findForUpdateById("c1")).thenReturn(Optional.of(checkout));
        when(inboxService.markProcessed(eq("evt-1"), anyString())).thenReturn(false);

        service.onPaymentFailed("evt-1", "c1");

        assertEquals(CheckoutStatus.PENDING_PAYMENT, checkout.getStatus());
        verify(vendorClient, never()).release(anyString());
    }

    // ----- the deadline -----

    @Test
    void anUnpaidCheckoutExpiresAndItsStockGoesBack() {
        Checkout checkout = checkout(CheckoutStatus.PENDING_PAYMENT);
        when(checkoutRepository.findForUpdateByStatusAndExpiresAtBefore(
                        eq(CheckoutStatus.PENDING_PAYMENT), any(), any()))
                .thenReturn(List.of(checkout));

        int expired = service.expireOverdue();

        assertEquals(1, expired);
        assertEquals(CheckoutStatus.EXPIRED, checkout.getStatus());
        verify(vendorClient).release("c1");
    }

    /** Nothing overdue, nothing released. */
    @Test
    void aCheckoutBeforeItsDeadlineIsNotExpired() {
        when(checkoutRepository.findForUpdateByStatusAndExpiresAtBefore(
                        eq(CheckoutStatus.PENDING_PAYMENT), any(), any()))
                .thenReturn(List.of());

        assertEquals(0, service.expireOverdue());
        verify(vendorClient, never()).release(anyString());
    }

    // ----- helpers -----

    private void givenCart(CartItem... items) {
        when(cartItemRepository.findByBuyerAccountIdOrderByCreatedAtAsc(BUYER.accountId()))
                .thenReturn(List.of(items));
    }

    private void givenSnapshot() {
        when(catalogClient.snapshot(any())).thenReturn(snapshot(null));
    }

    private void givenStockHeld() {
        when(vendorClient.reserve(any()))
                .thenAnswer(call -> new StockReservationResponse(
                        "c",
                        "HELD",
                        Instant.now(),
                        List.of(
                                new StockReservationResponse.Item("p1", "v1", 2, 100_000L),
                                new StockReservationResponse.Item("p2", "v2", 1, 250_000L))));
    }

    private void givenPayment() {
        when(paymentClient.createPayment(anyString(), any()))
                .thenReturn(new CreatePaymentResponse("pay-1", "https://vnpay"));
    }

    /**
     * The catalog's answer: two products of two shops, each with its own fee.
     *
     * @param ownerAccountId the owner of the first shop; null = a shop the buyer does not own
     * @param p1OnSale false puts the first product off sale
     */
    private static ProductSnapshotResponse snapshot(String ownerAccountId) {
        return snapshot(ownerAccountId, true, true);
    }

    private static ProductSnapshotResponse snapshot(String ownerAccountId, boolean v2Delivers) {
        return snapshot(ownerAccountId, true, v2Delivers);
    }

    private static ProductSnapshotResponse snapshot(String ownerAccountId, boolean p1OnSale, boolean v2Delivers) {
        return new ProductSnapshotResponse(
                List.of(
                        new ProductPart(
                                "p1", "v1", ownerAccountId, "Bánh nướng", 100_000L, 10, null, "LOCAL", p1OnSale, null),
                        new ProductPart(
                                "p2", "v2", "owner-2", "Bánh dẻo", 250_000L, 10, null, "NATIONWIDE", true, null),
                        new ProductPart("p3", "v1", "owner-2", "Bánh bò", 50_000L, 10, null, "LOCAL", true, null)),
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
        checkout.setExpiresAt(Instant.now().plusSeconds(600));
        return checkout;
    }

    private static CheckoutGroup group(String vendorId, String orderId) {
        CheckoutGroup group = new CheckoutGroup();
        group.setCheckoutId("c1");
        group.setVendorId(vendorId);
        group.setOrderId(orderId);
        group.setItemsAmount(vendorId.equals("v1") ? 200_000L : 250_000L);
        group.setShippingFee(vendorId.equals("v1") ? 30_000L : 45_000L);
        return group;
    }

    private static CheckoutLine line(int lineNo, String vendorId, String productId) {
        CheckoutLine line = new CheckoutLine();
        line.setCheckoutId("c1");
        line.setLineNo(lineNo);
        line.setVendorId(vendorId);
        line.setProductId(productId);
        line.setProductName("Bánh nướng");
        line.setUnitPrice(100_000L);
        line.setQuantity(2);
        return line;
    }

    private static FeignException conflict() {
        Request request = Request.create(
                Request.HttpMethod.POST, "http://vendor-service", Map.of(), null, StandardCharsets.UTF_8, null);
        return new FeignException.Conflict("stock gone", request, null, null);
    }

    /** Keeps the transaction template in one place; the mock manager answers every transaction. */
    private static final class TransactionTemplateHolder {

        org.springframework.transaction.support.TransactionTemplate template() {
            return new org.springframework.transaction.support.TransactionTemplate(
                    mock(org.springframework.transaction.PlatformTransactionManager.class));
        }
    }
}
