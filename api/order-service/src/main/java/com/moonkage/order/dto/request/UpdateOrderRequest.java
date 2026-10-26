package com.moonkage.order.dto.request;

import com.moonkage.order.enums.OrderStatus;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/orders/{orderId}. The vendor moves {@code status} one step forward (FR-32, FR-40, FR-42); each step
 * writes a progress update with {@code note}. The buyer sends only {@code receivedConfirmed = true} (FR-11).
 *
 * @param trackingCode required when an interprovince buy-now order goes to SHIPPING (AC-32.3)
 */
public record UpdateOrderRequest(
        OrderStatus status,
        @Size(max = 100) String trackingCode,
        @Size(max = 2000) String note,
        Boolean receivedConfirmed) {}
