package com.moonkage.order.service;

import com.moonkage.order.dto.event.QuoteAcceptedEvent;
import com.moonkage.order.dto.request.UpdateOrderRequest;
import com.moonkage.order.dto.response.OrderResponse;
import com.moonkage.order.dto.response.PageResponse;
import com.moonkage.order.dto.response.PaymentLinkResponse;
import com.moonkage.order.dto.response.ProgressUpdateResponse;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.security.CurrentUserInfo;
import java.util.List;

/** Root Order (order.md): buy-now and custom orders, read by buyer, vendor owner and admin. */
public interface OrderService {

    /**
     * {@code vendorId} set: the orders of that Shop, for its owner or an admin (FR-32, AC-44.3). Otherwise an admin
     * sees every order and a member their own purchases (FR-10, FR-21), grouped by {@code paymentGroupId} (BR-29).
     */
    PageResponse<OrderResponse> list(
            CurrentUserInfo caller,
            String vendorId,
            String paymentGroupId,
            OrderKind kind,
            OrderStatus status,
            boolean missingInvoice,
            int page,
            int size);

    OrderResponse get(CurrentUserInfo caller, String orderId);

    /**
     * The vendor moves the order one step forward (FR-32, FR-40, FR-42); the buyer confirms receipt (FR-11). Each
     * step is recorded as a progress update and announced.
     */
    OrderResponse update(CurrentUserInfo caller, String orderId, UpdateOrderRequest request);

    List<ProgressUpdateResponse> progressUpdates(CurrentUserInfo caller, String orderId);

    /** FR-22: the buyer pays the rest of a delivered custom order. */
    PaymentLinkResponse payRemainder(CurrentUserInfo caller, String orderId);

    /** quote.accepted: the custom order, under the acceptance's id (D-12). Safe to repeat. */
    void createFromQuote(QuoteAcceptedEvent event);

    /** payment.succeeded (REMAINDER): the custom order is completed (AC-22.2). Safe to repeat. */
    void onRemainderPaid(String eventId, String orderId);
}
