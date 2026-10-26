package com.moonkage.order.controller;

import com.moonkage.order.dto.request.UpdateOrderRequest;
import com.moonkage.order.dto.response.OrderResponse;
import com.moonkage.order.dto.response.PageResponse;
import com.moonkage.order.dto.response.PaymentLinkResponse;
import com.moonkage.order.dto.response.ProgressUpdateResponse;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Root Order (order.md). Buyer, vendor owner and admin each see the orders they are part of. */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Member: own purchases, grouped by {@code paymentGroupId} (FR-10, BR-29). {@code vendorId}: the orders of the
     * caller's Shop, {@code missingInvoice=true} for those still without an invoice (FR-32, AC-44.3). Admin: all.
     */
    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> list(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) String paymentGroupId,
            @RequestParam(required = false) OrderKind kind,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "false") boolean missingInvoice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(
                orderService.list(caller, vendorId, paymentGroupId, kind, status, missingInvoice, page, size));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponse> get(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(orderService.get(caller, orderId));
    }

    /**
     * Vendor: {@code {status, trackingCode?, note?}}, one step forward (FR-32, FR-40, FR-42). Buyer:
     * {@code {receivedConfirmed: true}} (FR-11).
     */
    @PatchMapping("/{orderId}")
    public ApiResponse<OrderResponse> update(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderRequest request) {
        return ApiResponse.ok(orderService.update(caller, orderId, request));
    }

    /** FR-21: the order's history, read only. */
    @GetMapping("/{orderId}/progress-updates")
    public ApiResponse<List<ProgressUpdateResponse>> progressUpdates(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(orderService.progressUpdates(caller, orderId));
    }

    /** FR-22: pay the rest of a delivered custom order. */
    @PostMapping("/{orderId}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentLinkResponse> payRemainder(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.created(orderService.payRemainder(caller, orderId));
    }
}
