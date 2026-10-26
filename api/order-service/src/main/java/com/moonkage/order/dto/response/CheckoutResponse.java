package com.moonkage.order.dto.response;

import com.moonkage.order.enums.CheckoutStatus;
import java.time.Instant;
import java.util.List;

/** @param orderIds one per Shop, once SUCCEEDED (AC-09.7); empty before */
public record CheckoutResponse(
        String checkoutId,
        CheckoutStatus status,
        long totalAmount,
        String paymentId,
        Instant expiresAt,
        List<String> orderIds) {}
