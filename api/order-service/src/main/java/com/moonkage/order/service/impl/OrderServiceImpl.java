package com.moonkage.order.service.impl;

import com.moonkage.api.PageResponse;
import com.moonkage.observability.MoneyMetrics;
import com.moonkage.order.client.PaymentClient;
import com.moonkage.order.client.VendorClient;
import com.moonkage.order.client.dto.CreatePaymentRequest;
import com.moonkage.order.client.dto.CreatePaymentResponse;
import com.moonkage.order.client.dto.ReserveStockRequest;
import com.moonkage.order.client.dto.ReturnStockRequest;
import com.moonkage.order.client.dto.VendorView;
import com.moonkage.order.client.facade.VendorDirectory;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.inbound.QuoteAcceptedEvent;
import com.moonkage.order.dto.request.UpdateOrderRequest;
import com.moonkage.order.dto.response.OrderResponse;
import com.moonkage.order.dto.response.PaymentLinkResponse;
import com.moonkage.order.dto.response.ProgressUpdateResponse;
import com.moonkage.order.entity.InvoiceInfo;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
import com.moonkage.order.entity.ProgressUpdate;
import com.moonkage.order.enums.DisputeStatus;
import com.moonkage.order.enums.MockupReviewStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.DisputeRepository;
import com.moonkage.order.repository.MockupVersionRepository;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.repository.ProgressUpdateRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.InboxService;
import com.moonkage.order.service.OrderService;
import com.moonkage.order.service.publisher.OrderEventPublisher;
import com.moonkage.order.storage.OrderFileService;
import feign.FeignException;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final int AUTO_CONFIRM_BATCH = 100;
    private static final String AUTO_CONFIRM_NOTE = "Hệ thống tự xác nhận đã nhận hàng vì hết thời hạn khiếu nại";

    private static final int MAX_PAGE_SIZE = 100;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DisputeRepository disputeRepository;
    private final MockupVersionRepository mockupVersionRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final InboxService inboxService;
    private final OrderEventPublisher orderEvents;
    private final VendorDirectory vendorDirectory;
    private final PaymentClient paymentClient;
    private final VendorClient vendorClient;
    private final OrderProperties properties;
    private final EntityManager entityManager;
    private final OrderFileService fileService;
    private final MoneyMetrics moneyMetrics;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> list(
            CurrentUserInfo caller,
            String vendorId,
            String paymentGroupId,
            OrderKind kind,
            OrderStatus status,
            boolean missingInvoice,
            boolean openDispute,
            int page,
            int size) {
        String buyerAccountId = null;
        if (vendorId != null) {
            if (!caller.isAdmin()
                    && !vendorDirectory
                            .ownedVendorId(caller.accountId())
                            .filter(vendorId::equals)
                            .isPresent()) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
        } else if (!caller.isAdmin()) {
            buyerAccountId = caller.accountId();
        }
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        Page<Order> orders = orderRepository.search(
                buyerAccountId, vendorId, paymentGroupId, kind, status, missingInvoice, openDispute, pageable);
        List<String> orderIds = orders.map(Order::getId).toList();
        Map<String, List<OrderItem>> itemsByOrder = orders.isEmpty()
                ? Map.of()
                : orderItemRepository.findByOrderIdIn(orderIds).stream()
                        .collect(Collectors.groupingBy(item -> item.getOrder().getId()));
        Set<String> disputed = orders.isEmpty() ? Set.of() : disputeRepository.findOrderIdsWithOpenDispute(orderIds);
        return PageResponse.from(orders.map(order -> toResponse(
                order, itemsByOrder.getOrDefault(order.getId(), List.of()), disputed.contains(order.getId()))));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse get(CurrentUserInfo caller, String orderId) {
        Order order = orderRepository
                .findById(orderId)
                .filter(o -> canRead(caller, o))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return toResponse(order, orderItemRepository.findByOrderId(orderId));
    }

    @Override
    @Transactional
    public OrderResponse update(CurrentUserInfo caller, String orderId, UpdateOrderRequest request) {
        Order order = orderRepository
                .findForUpdateById(orderId)
                .filter(o -> canRead(caller, o))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (Boolean.TRUE.equals(request.receivedConfirmed())) {
            confirmReceived(caller, order);
        } else if (request.status() != null) {
            advance(caller, order, request);
        } else {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return toResponse(order, orderItemRepository.findByOrderId(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressUpdateResponse> progressUpdates(CurrentUserInfo caller, String orderId) {
        boolean readable = orderRepository
                .findById(orderId)
                .filter(o -> canRead(caller, o))
                .isPresent();
        if (!readable) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }
        return progressUpdateRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(p -> new ProgressUpdateResponse(
                        p.getMilestone(), p.getNote(), List.copyOf(p.getPhotoKeys()), p.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentLinkResponse payRemainder(CurrentUserInfo caller, String orderId) {
        Order order = orderRepository
                .findById(orderId)
                .filter(o -> o.getBuyerAccountId().equals(caller.accountId()))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getKind() != OrderKind.CUSTOM_ORDER
                || order.getStatus() != OrderStatus.DELIVERED
                || order.getRemainingAmount() == null
                || order.getRemainingAmount() <= 0) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        try {
            CreatePaymentResponse payment = paymentClient.createPayment(
                    orderId,
                    new CreatePaymentRequest(
                            CreatePaymentRequest.REMAINDER,
                            orderId,
                            caller.accountId(),
                            order.getRemainingAmount(),
                            null,
                            null,
                            null));
            return new PaymentLinkResponse(payment.paymentId(), payment.paymentUrl());
        } catch (FeignException.Conflict e) {
            // P-03: already paid; payment.succeeded completes the order
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
    }

    @Override
    @Transactional
    public void createFromQuote(QuoteAcceptedEvent event) {
        if (!inboxService.markProcessed(event.eventId(), RabbitConfig.QUOTE_ACCEPTED_ROUTING_KEY)
                || orderRepository.existsById(event.acceptanceId())) {
            return;
        }
        QuoteAcceptedEvent.QuotePart quote = event.snapshot().quote();
        QuoteAcceptedEvent.DeliveryPart delivery = event.snapshot().delivery();
        Order order = new Order();
        // payment-service booked the deposit on this id (payment.md, POST /internal/payments)
        order.setId(event.acceptanceId());
        order.setKind(OrderKind.CUSTOM_ORDER);
        order.setStatus(OrderStatus.DEPOSITED);
        order.setBuyerAccountId(event.buyerAccountId());
        order.setVendorId(event.vendorId());
        order.setVendorName(vendorNameOf(event.vendorId()));
        order.setQuoteId(event.quoteId());
        order.setAgreementId(event.acceptanceId());
        order.setAgreementHash(event.contentHash());
        order.setItemsAmount(quote.itemsAmount() + quote.customSurcharge());
        order.setShippingFee(quote.shippingFee());
        order.setDiscountAmount(0L);
        order.setTotalAmount(quote.totalAmount());
        order.setDepositAmount(quote.depositAmount());
        order.setRemainingAmount(quote.remainingAmount());
        // a custom order is delivered as agreed in the quote; the interprovince rules are for buy-now (BR-30)
        order.setInterprovince(false);
        order.setHasCustom(!event.snapshot().request().customTypes().isEmpty());
        order.setInvoiceInfo(invoiceOf(event.snapshot().invoice()));
        order.setRecipientName(delivery.recipientName());
        order.setRecipientPhone(delivery.recipientPhone());
        order.setDeliveryProvinceCode(delivery.provinceCode());
        order.setDeliveryAddressDetail(delivery.addressDetail());
        order.setDeliveryDate(quote.deliveryDate());
        order.setDeliveryMethod(quote.deliveryMethod());
        entityManager.persist(order);
        quote.items().forEach(line -> orderItemRepository.save(toItem(order, event.quoteId(), line)));
        entityManager.flush();
        // BE-11b: the counter that is compared with payment.succeeded to catch money without an order
        moneyMetrics.orderCreated(OrderKind.CUSTOM_ORDER.name());
        orderEvents.announce(RabbitConfig.ORDER_CREATED_ROUTING_KEY, order);
    }

    @Override
    @Transactional
    public void onRemainderPaid(String eventId, String orderId) {
        if (!inboxService.markProcessed(eventId, RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY)) {
            return;
        }
        Order order = orderRepository.findForUpdateById(orderId).orElse(null);
        if (order == null || order.getKind() != OrderKind.CUSTOM_ORDER || order.getStatus() != OrderStatus.DELIVERED) {
            return;
        }
        moveTo(order, OrderStatus.COMPLETED, null, List.of());
        orderEvents.announce(RabbitConfig.ORDER_STATUS_CHANGED_ROUTING_KEY, order);
    }

    /** FR-11: the buyer received a delivered order; a buy-now order is then completed. */
    private void confirmReceived(CurrentUserInfo caller, Order order) {
        if (!order.getBuyerAccountId().equals(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (order.getStatus() != OrderStatus.DELIVERED || order.getReceivedConfirmedAt() != null) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        // A buy-now order would complete here while the admin has yet to decide who gets the money.
        if (disputeRepository.existsByOrderIdAndStatus(order.getId(), DisputeStatus.OPEN)) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_OPEN);
        }
        markReceived(order, null);
    }

    @Override
    @Transactional
    public int confirmOverdue() {
        List<Order> overdue = orderRepository.findForUpdateUnconfirmedPastDeadline(
                Instant.now(), PageRequest.of(0, AUTO_CONFIRM_BATCH));
        overdue.forEach(order -> markReceived(order, AUTO_CONFIRM_NOTE));
        return overdue.size();
    }

    /** Received: a buy-now order completes (payment-service then pays the Shop); a custom order awaits the rest. */
    private void markReceived(Order order, String note) {
        order.setReceivedConfirmedAt(Instant.now());
        if (order.getKind() == OrderKind.BUY_NOW) {
            moveTo(order, OrderStatus.COMPLETED, note, List.of());
        } else {
            entityManager.flush();
        }
        orderEvents.announce(RabbitConfig.ORDER_RECEIVED_CONFIRMED_ROUTING_KEY, order);
    }

    /** FR-32, FR-40, FR-42: only the vendor's owner, only the next step, with its checks. */
    private void advance(CurrentUserInfo caller, Order order, UpdateOrderRequest request) {
        if (!vendorDirectory
                .ownedVendorId(caller.accountId())
                .filter(order.getVendorId()::equals)
                .isPresent()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (request.status() == OrderStatus.REJECTED) {
            reject(order, request.note());
            return;
        }
        if (request.status() != nextStatus(order)) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        // FR-39: uploading the mockup is what moves the order to the buyer's review; a bare status change would
        // leave the buyer nothing to review.
        if (request.status() == OrderStatus.AWAITING_MOCKUP_APPROVAL) {
            throw new AppException(ErrorCode.MOCKUP_REQUIRED);
        }
        if (request.status() == OrderStatus.SHIPPING) {
            if (order.isInterprovince() && !StringUtils.hasText(request.trackingCode())) {
                throw new AppException(ErrorCode.TRACKING_CODE_REQUIRED);
            }
            order.setTrackingCode(
                    StringUtils.hasText(request.trackingCode())
                            ? request.trackingCode().trim()
                            : null);
        }
        if (order.getStatus() == OrderStatus.AWAITING_MOCKUP_APPROVAL
                && !mockupVersionRepository.existsByOrderIdAndReviewStatus(
                        order.getId(), MockupReviewStatus.APPROVED)) {
            throw new AppException(ErrorCode.MOCKUP_NOT_APPROVED);
        }
        if (request.status() == OrderStatus.DELIVERED) {
            Instant now = Instant.now();
            order.setDeliveredAt(now);
            order.setComplaintDeadline(now.plus(complaintWindow(order)));
        }
        List<String> photoKeys = request.photoTempKeys() == null
                ? List.of()
                : request.photoTempKeys().stream()
                        .map(tempKey -> fileService.attach(order.getId(), tempKey))
                        .toList();
        moveTo(order, request.status(), request.note(), photoKeys);
        orderEvents.announce(
                request.status() == OrderStatus.DELIVERED
                        ? RabbitConfig.ORDER_DELIVERED_ROUTING_KEY
                        : RabbitConfig.ORDER_STATUS_CHANGED_ROUTING_KEY,
                order);
    }

    /**
     * Q-01: the Shop refuses a paid buy-now order it has not confirmed yet, with a reason the buyer sees.
     * payment-service reads order.status_changed and returns the order's money to the buyer's wallet.
     */
    private void reject(Order order, String reason) {
        boolean buyNow = order.getKind() == OrderKind.BUY_NOW && order.getStatus() == OrderStatus.PAID;
        boolean custom = order.getKind() == OrderKind.CUSTOM_ORDER && order.getStatus() == OrderStatus.DEPOSITED;
        if (!buyNow && !custom) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        if (!StringUtils.hasText(reason)) {
            throw new AppException(ErrorCode.REJECT_REASON_REQUIRED);
        }
        // a Shop that already took part of the deposit settles through a dispute, not a full refund
        if (custom && !paymentClient.ledgerState(order.getId()).untouched()) {
            throw new AppException(ErrorCode.REJECT_AFTER_DISBURSEMENT);
        }
        moveTo(order, OrderStatus.REJECTED, reason, List.of());
        orderEvents.announce(RabbitConfig.ORDER_STATUS_CHANGED_ROUTING_KEY, order);
        if (buyNow) {
            returnStock(order);
        }
    }

    /**
     * Last, so a failure above leaves the stock alone; vendor-service does it once per order. An order without a
     * committed reservation (seed data, an order older than reservations) has no stock to give back: the rejection
     * still goes through. Any other failure rolls the rejection back, so the Shop can try again.
     */
    private void returnStock(Order order) {
        try {
            vendorClient.returnStock(new ReturnStockRequest(
                    order.getId(),
                    order.getPaymentGroupId(),
                    orderItemRepository.findByOrderId(order.getId()).stream()
                            .map(item -> new ReserveStockRequest.Item(item.getProductId(), item.getQuantity()))
                            .toList()));
        } catch (FeignException.NotFound e) {
            log.warn(
                    "Order {} was rejected without returning stock: its checkout has no committed reservation",
                    order.getId());
        }
    }

    /** The one status the vendor may move the order to, null when none (7.1 Order.status). */
    private static OrderStatus nextStatus(Order order) {
        if (order.getKind() == OrderKind.BUY_NOW) {
            return switch (order.getStatus()) {
                case PAID -> OrderStatus.CONFIRMED;
                case CONFIRMED -> OrderStatus.SHIPPING;
                case SHIPPING -> OrderStatus.DELIVERED;
                default -> null;
            };
        }
        return switch (order.getStatus()) {
            // BR-15: custom work waits for an approved mockup
            case DEPOSITED -> order.isHasCustom() ? OrderStatus.AWAITING_MOCKUP_APPROVAL : OrderStatus.IN_PRODUCTION;
            case AWAITING_MOCKUP_APPROVAL -> OrderStatus.IN_PRODUCTION;
            case IN_PRODUCTION -> OrderStatus.READY_TO_SHIP;
            case READY_TO_SHIP -> OrderStatus.DELIVERED;
            default -> null;
        };
    }

    /** D-13, Q-10: longer for interprovince buy-now and every custom order. */
    private Duration complaintWindow(Order order) {
        boolean local = order.getKind() == OrderKind.BUY_NOW && !order.isInterprovince();
        return local ? properties.getComplaintWindowLocal() : properties.getComplaintWindowOther();
    }

    /** Changes the status and records it in the order's progress history (FR-21, FR-40). */
    private void moveTo(Order order, OrderStatus status, String note, List<String> photoKeys) {
        order.setStatus(status);
        ProgressUpdate update = new ProgressUpdate();
        update.setOrder(order);
        update.setMilestone(status);
        update.setNote(StringUtils.hasText(note) ? note.trim() : null);
        update.getPhotoKeys().addAll(photoKeys);
        progressUpdateRepository.save(update);
        entityManager.flush();
    }

    private boolean canRead(CurrentUserInfo caller, Order order) {
        return caller.isAdmin()
                || order.getBuyerAccountId().equals(caller.accountId())
                || vendorDirectory
                        .ownedVendorId(caller.accountId())
                        .filter(order.getVendorId()::equals)
                        .isPresent();
    }

    private static InvoiceInfo invoiceOf(QuoteAcceptedEvent.InvoicePart invoice) {
        if (invoice == null || !StringUtils.hasText(invoice.name())) {
            return null;
        }
        InvoiceInfo info = new InvoiceInfo();
        info.setInvoiceName(invoice.name());
        info.setInvoiceTaxCode(invoice.taxCode());
        info.setInvoiceAddress(invoice.address());
        info.setInvoiceEmail(invoice.email());
        return info;
    }

    /** The Shop's name to keep on a custom order; null when vendor-service cannot answer, the order is made anyway. */
    private String vendorNameOf(String vendorId) {
        try {
            return vendorDirectory.find(vendorId).map(VendorView::businessName).orElse(null);
        } catch (FeignException e) {
            log.warn("Name of vendor {} unknown for its custom order: {}", vendorId, e.getMessage());
            return null;
        }
    }

    /** A custom line has no catalog product; it is kept under the quote's id. */
    private static OrderItem toItem(Order order, String quoteId, QuoteAcceptedEvent.LinePart line) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductId(Objects.requireNonNullElse(line.productRef(), quoteId));
        item.setProductName(line.description());
        item.setUnitPrice(line.unitPrice());
        item.setQuantity(line.quantity());
        item.setSubtotal(line.amount());
        return item;
    }

    private OrderResponse toResponse(Order order, List<OrderItem> items) {
        return toResponse(order, items, disputeRepository.existsByOrderIdAndStatus(order.getId(), DisputeStatus.OPEN));
    }

    private OrderResponse toResponse(Order order, List<OrderItem> items, boolean disputeOpen) {
        InvoiceInfo invoice = order.getInvoiceInfo();
        return new OrderResponse(
                order.getId(),
                order.getKind(),
                order.getStatus(),
                order.getBuyerAccountId(),
                order.getVendorId(),
                order.getVendorName(),
                order.getPaymentGroupId(),
                order.getQuoteId(),
                order.getItemsAmount(),
                order.getShippingFee(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getDepositAmount(),
                order.getRemainingAmount(),
                order.isInterprovince(),
                order.isHasCustom(),
                order.getRecipientName(),
                order.getRecipientPhone(),
                order.getDeliveryProvinceCode(),
                order.getDeliveryAddressDetail(),
                order.getDeliveryDate(),
                order.getDeliveryMethod(),
                order.getTrackingCode(),
                invoice == null || invoice.getInvoiceName() == null
                        ? null
                        : new OrderResponse.InvoiceInfoResponse(
                                invoice.getInvoiceName(),
                                invoice.getInvoiceTaxCode(),
                                invoice.getInvoiceAddress(),
                                invoice.getInvoiceEmail()),
                order.getInvoiceObjectKey() != null,
                order.getDeliveredAt(),
                order.getReceivedConfirmedAt(),
                order.getComplaintDeadline(),
                disputeOpen,
                order.getCreatedAt(),
                items.stream()
                        .map(i -> new OrderResponse.Item(
                                i.getProductId(),
                                i.getProductName(),
                                fileService.publicUrl(i.getImageKey()),
                                i.getUnitPrice(),
                                i.getQuantity(),
                                i.getSubtotal()))
                        .toList());
    }
}
