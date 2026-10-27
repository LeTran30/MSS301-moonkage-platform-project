package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
import java.time.Instant;

/**
 * A payment as its payer sees it (FR-09). PENDING after the VNPay return page only means the IPN has not arrived
 * yet: the web page polls until it changes (BR-25).
 *
 * @param referenceId checkoutId, acceptanceId, orderId or vendorId, by purpose; the web page opens it next
 */
public record PaymentResponse(
        String paymentId,
        PaymentPurpose purpose,
        String referenceId,
        long amount,
        PaymentStatus status,
        String gatewayResponseCode,
        Instant expiresAt,
        Instant paidAt) {}
