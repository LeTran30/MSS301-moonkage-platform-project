package com.moonkage.order.service.impl;

import com.moonkage.order.client.CatalogClient;
import com.moonkage.order.client.PaymentClient;
import com.moonkage.order.client.VendorClient;
import com.moonkage.order.client.dto.CreatePaymentRequest;
import com.moonkage.order.client.dto.CreatePaymentResponse;
import com.moonkage.order.client.dto.ProductSnapshotRequest;
import com.moonkage.order.client.dto.ProductSnapshotResponse;
import com.moonkage.order.client.dto.ProductSnapshotResponse.ProductPart;
import com.moonkage.order.client.dto.ProductSnapshotResponse.VendorPart;
import com.moonkage.order.client.dto.RefundRequest;
import com.moonkage.order.client.dto.ReserveStockRequest;
import com.moonkage.order.client.dto.StockReservationResponse;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.request.CreateCheckoutRequest;
import com.moonkage.order.dto.response.CheckoutResponse;
import com.moonkage.order.dto.response.CreateCheckoutResponse;
import com.moonkage.order.entity.CartItem;
import com.moonkage.order.entity.Checkout;
import com.moonkage.order.entity.CheckoutGroup;
import com.moonkage.order.entity.CheckoutLine;
import com.moonkage.order.entity.InvoiceInfo;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
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
import com.moonkage.order.service.CheckoutService;
import com.moonkage.order.service.InboxService;
import com.moonkage.order.service.OrderEventPublisher;
import feign.FeignException;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private static final int EXPIRY_BATCH = 100;

    private final CheckoutRepository checkoutRepository;
    private final CheckoutGroupRepository groupRepository;
    private final CheckoutLineRepository lineRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    private final InboxService inboxService;
    private final OrderEventPublisher orderEvents;
    private final CatalogClient catalogClient;
    private final VendorClient vendorClient;
    private final PaymentClient paymentClient;
    private final OrderProperties properties;
    private final TransactionTemplate transactionTemplate;
    private final EntityManager entityManager;

    @Override
    public CreateCheckoutResponse create(CurrentUserInfo caller, CreateCheckoutRequest request) {
        List<CartItem> cart = cartItemRepository.findByBuyerAccountIdOrderByCreatedAtAsc(caller.accountId());
        if (cart.isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }
        ProductSnapshotResponse snapshot = catalogClient.snapshot(new ProductSnapshotRequest(
                request.provinceCode(),
                cart.stream().map(CartItem::getProductId).toList()));
        checkBuyable(caller, cart, snapshot);

        // P-01: one clock, set here. The payment ends first; checkout and stock hold last a little longer.
        Instant paymentExpiresAt = Instant.now().plus(properties.getPaymentLifetime());
        Instant expiresAt = paymentExpiresAt.plus(properties.getCheckoutGrace());
        String checkoutId = UUID.randomUUID().toString();
        StockReservationResponse held = reserve(checkoutId, expiresAt, cart);

        Checkout checkout = newCheckout(checkoutId, caller, request, expiresAt);
        Map<String, CheckoutGroup> groups = new LinkedHashMap<>();
        List<CheckoutLine> lines = new ArrayList<>();
        for (StockReservationResponse.Item item : held.items()) {
            VendorPart vendor = snapshot.vendor(item.vendorId()).orElseThrow();
            CheckoutGroup group = groups.computeIfAbsent(item.vendorId(), id -> newGroup(checkoutId, vendor));
            group.setItemsAmount(group.getItemsAmount() + item.unitPrice() * item.qty());
            lines.add(newLine(
                    checkoutId,
                    lines.size() + 1,
                    item,
                    snapshot.product(item.productId()).orElseThrow()));
        }
        checkout.setTotalAmount(
                groups.values().stream().mapToLong(CheckoutGroup::totalAmount).sum());
        transactionTemplate.executeWithoutResult(status -> {
            checkoutRepository.save(checkout);
            groupRepository.saveAll(groups.values());
            lineRepository.saveAll(lines);
        });

        CreatePaymentResponse payment;
        try {
            payment = paymentClient.createPayment(new CreatePaymentRequest(
                    CreatePaymentRequest.CHECKOUT,
                    checkoutId,
                    caller.accountId(),
                    checkout.getTotalAmount(),
                    paymentExpiresAt,
                    groups.values().stream()
                            .map(g -> new CreatePaymentRequest.Allocation(g.getOrderId(), g.totalAmount()))
                            .toList()));
        } catch (RuntimeException e) {
            transactionTemplate.executeWithoutResult(status -> checkoutRepository
                    .findForUpdateById(checkoutId)
                    .ifPresent(c -> c.setStatus(CheckoutStatus.FAILED)));
            releaseQuietly(checkoutId);
            throw e;
        }
        transactionTemplate.executeWithoutResult(status ->
                checkoutRepository.findForUpdateById(checkoutId).ifPresent(c -> c.setPaymentId(payment.paymentId())));
        return new CreateCheckoutResponse(
                checkoutId, payment.paymentId(), payment.paymentUrl(), checkout.getTotalAmount(), expiresAt);
    }

    @Override
    @Transactional(readOnly = true)
    public CheckoutResponse get(CurrentUserInfo caller, String checkoutId) {
        Checkout checkout = checkoutRepository
                .findById(checkoutId)
                .filter(c -> c.getBuyerAccountId().equals(caller.accountId()))
                .orElseThrow(() -> new AppException(ErrorCode.CHECKOUT_NOT_FOUND));
        List<String> orderIds = checkout.getStatus() == CheckoutStatus.SUCCEEDED
                ? groupRepository.findByCheckoutId(checkoutId).stream()
                        .map(CheckoutGroup::getOrderId)
                        .toList()
                : List.of();
        return new CheckoutResponse(
                checkoutId,
                checkout.getStatus(),
                checkout.getTotalAmount(),
                checkout.getPaymentId(),
                checkout.getExpiresAt(),
                orderIds);
    }

    @Override
    public void onPaid(String eventId, String checkoutId, String paymentId) {
        Checkout current = checkoutRepository.findById(checkoutId).orElse(null);
        if (current == null) {
            log.error("payment.succeeded {} names checkout {}, which does not exist", eventId, checkoutId);
            return;
        }
        if (isSettled(current.getStatus())) {
            return;
        }
        // remote calls first: both answer the same when repeated, so a redelivery after a crash is safe
        boolean committed = commitStock(checkoutId);
        if (!committed) {
            paymentClient.requestRefund(
                    new RefundRequest(paymentId, RefundRequest.LATE_PAYMENT, current.getTotalAmount()));
        }
        transactionTemplate.executeWithoutResult(status -> {
            if (!inboxService.markProcessed(eventId, RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY)) {
                return;
            }
            Checkout checkout = checkoutRepository.findForUpdateById(checkoutId).orElseThrow();
            if (isSettled(checkout.getStatus())) {
                return;
            }
            checkout.setPaymentId(paymentId);
            if (!committed) {
                log.warn("Checkout {} was paid after its stock was sold; payment {} refunded", checkoutId, paymentId);
                checkout.setStatus(CheckoutStatus.REFUND_REQUESTED);
                return;
            }
            checkout.setStatus(CheckoutStatus.SUCCEEDED);
            createOrders(checkout);
        });
    }

    @Override
    public void onPaymentFailed(String eventId, String checkoutId) {
        Boolean release = transactionTemplate.execute(status -> {
            if (!inboxService.markProcessed(eventId, RabbitConfig.PAYMENT_FAILED_ROUTING_KEY)) {
                return false;
            }
            Checkout checkout = checkoutRepository.findForUpdateById(checkoutId).orElse(null);
            if (checkout == null || checkout.getStatus() != CheckoutStatus.PENDING_PAYMENT) {
                return false;
            }
            checkout.setStatus(CheckoutStatus.FAILED);
            return true;
        });
        if (Boolean.TRUE.equals(release)) {
            releaseQuietly(checkoutId);
        }
    }

    @Override
    public int expireOverdue() {
        List<String> expired = transactionTemplate.execute(status -> {
            List<Checkout> overdue = checkoutRepository.findForUpdateByStatusAndExpiresAtBefore(
                    CheckoutStatus.PENDING_PAYMENT, Instant.now(), PageRequest.of(0, EXPIRY_BATCH));
            overdue.forEach(c -> c.setStatus(CheckoutStatus.EXPIRED));
            return overdue.stream().map(Checkout::getId).toList();
        });
        if (expired == null) {
            return 0;
        }
        expired.forEach(this::releaseQuietly);
        return expired.size();
    }

    /** One BUY_NOW order per Shop, under the id issued with the checkout (BR-29, P-01); bought items leave the cart. */
    private void createOrders(Checkout checkout) {
        List<CheckoutLine> lines = lineRepository.findByCheckoutIdOrderByLineNo(checkout.getId());
        for (CheckoutGroup group : groupRepository.findByCheckoutId(checkout.getId())) {
            Order order = new Order();
            order.setId(group.getOrderId());
            order.setKind(OrderKind.BUY_NOW);
            order.setStatus(OrderStatus.PAID);
            order.setBuyerAccountId(checkout.getBuyerAccountId());
            order.setVendorId(group.getVendorId());
            order.setPaymentGroupId(checkout.getId());
            order.setItemsAmount(group.getItemsAmount());
            order.setShippingFee(group.getShippingFee());
            order.setDiscountAmount(0L);
            order.setTotalAmount(group.totalAmount());
            order.setInterprovince(group.isInterprovince());
            order.setHasCustom(false);
            order.setInvoiceInfo(copyOf(checkout.getInvoiceInfo()));
            order.setRecipientName(checkout.getRecipientName());
            order.setRecipientPhone(checkout.getRecipientPhone());
            order.setDeliveryProvinceCode(checkout.getProvinceCode());
            order.setDeliveryAddressDetail(checkout.getAddressDetail());
            entityManager.persist(order);
            lines.stream()
                    .filter(line -> line.getVendorId().equals(group.getVendorId()))
                    .forEach(line -> orderItemRepository.save(toItem(order, line)));
            entityManager.flush();
            orderEvents.announce(RabbitConfig.ORDER_CREATED_ROUTING_KEY, order);
        }
        cartItemRepository.deleteBought(
                checkout.getBuyerAccountId(),
                lines.stream().map(CheckoutLine::getProductId).toList());
    }

    /** BR-20, BR-21, BR-22, BR-30: every product on sale and not the caller's own, every Shop delivers there. */
    private static void checkBuyable(CurrentUserInfo caller, List<CartItem> cart, ProductSnapshotResponse snapshot) {
        for (CartItem item : cart) {
            ProductPart product = snapshot.product(item.getProductId())
                    .filter(ProductPart::purchasable)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_AVAILABLE));
            if (caller.accountId().equals(product.ownerAccountId())) {
                throw new AppException(ErrorCode.OWN_PRODUCT);
            }
            VendorPart vendor = snapshot.vendor(product.vendorId()).orElseThrow();
            if (!vendor.deliverable()) {
                throw new AppException(ErrorCode.NOT_DELIVERABLE, vendor.vendorName());
            }
        }
    }

    private StockReservationResponse reserve(String checkoutId, Instant expiresAt, List<CartItem> cart) {
        try {
            return vendorClient.reserve(new ReserveStockRequest(
                    checkoutId,
                    expiresAt,
                    cart.stream()
                            .map(i -> new ReserveStockRequest.Item(i.getProductId(), i.getQuantity()))
                            .toList()));
        } catch (FeignException.Conflict e) {
            throw new AppException(ErrorCode.STOCK_UNAVAILABLE);
        }
    }

    /** @return false when the stock was sold meanwhile (409): the payment came too late (P-01) */
    private boolean commitStock(String checkoutId) {
        try {
            vendorClient.commit(checkoutId);
            return true;
        } catch (FeignException.Conflict e) {
            return false;
        }
    }

    /** vendor-service releases the hold at expires_at anyway, so a failed call only delays it. */
    private void releaseQuietly(String checkoutId) {
        try {
            vendorClient.release(checkoutId);
        } catch (FeignException e) {
            log.warn(
                    "Stock of checkout {} not released now ({}); vendor releases it when it expires",
                    checkoutId,
                    e.getMessage());
        }
    }

    private static boolean isSettled(CheckoutStatus status) {
        return status == CheckoutStatus.SUCCEEDED || status == CheckoutStatus.REFUND_REQUESTED;
    }

    private static Checkout newCheckout(
            String checkoutId, CurrentUserInfo caller, CreateCheckoutRequest request, Instant expiresAt) {
        Checkout checkout = new Checkout();
        checkout.setId(checkoutId);
        checkout.setBuyerAccountId(caller.accountId());
        checkout.setRecipientName(request.recipientName());
        checkout.setRecipientPhone(request.recipientPhone());
        checkout.setProvinceCode(request.provinceCode());
        checkout.setAddressDetail(request.addressDetail());
        if (request.invoiceInfo() != null) {
            InvoiceInfo invoice = new InvoiceInfo();
            invoice.setInvoiceName(request.invoiceInfo().name());
            invoice.setInvoiceTaxCode(request.invoiceInfo().taxCode());
            invoice.setInvoiceAddress(request.invoiceInfo().address());
            invoice.setInvoiceEmail(request.invoiceInfo().email());
            checkout.setInvoiceInfo(invoice);
        }
        checkout.setStatus(CheckoutStatus.PENDING_PAYMENT);
        checkout.setExpiresAt(expiresAt);
        return checkout;
    }

    private static CheckoutGroup newGroup(String checkoutId, VendorPart vendor) {
        CheckoutGroup group = new CheckoutGroup();
        group.setCheckoutId(checkoutId);
        group.setVendorId(vendor.vendorId());
        group.setOrderId(UUID.randomUUID().toString());
        group.setItemsAmount(0L);
        group.setShippingFee(vendor.shippingFee());
        group.setInterprovince(vendor.interprovince());
        return group;
    }

    private static CheckoutLine newLine(
            String checkoutId, int lineNo, StockReservationResponse.Item item, ProductPart product) {
        CheckoutLine line = new CheckoutLine();
        line.setCheckoutId(checkoutId);
        line.setLineNo(lineNo);
        line.setVendorId(item.vendorId());
        line.setProductId(item.productId());
        line.setProductName(product.name());
        line.setUnitPrice(item.unitPrice());
        line.setQuantity(item.qty());
        return line;
    }

    private static OrderItem toItem(Order order, CheckoutLine line) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductId(line.getProductId());
        item.setProductName(line.getProductName());
        item.setUnitPrice(line.getUnitPrice());
        item.setQuantity(line.getQuantity());
        item.setSubtotal(line.getUnitPrice() * line.getQuantity());
        return item;
    }

    private static InvoiceInfo copyOf(InvoiceInfo source) {
        if (source == null || source.getInvoiceName() == null) {
            return null;
        }
        InvoiceInfo copy = new InvoiceInfo();
        copy.setInvoiceName(source.getInvoiceName());
        copy.setInvoiceTaxCode(source.getInvoiceTaxCode());
        copy.setInvoiceAddress(source.getInvoiceAddress());
        copy.setInvoiceEmail(source.getInvoiceEmail());
        return copy;
    }
}
