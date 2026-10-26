package com.moonkage.payment.dto.request;

import com.moonkage.payment.enums.RefundReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /internal/refunds (integration.md): order (LATE_PAYMENT, P-01) and quotation (QUOTE_EXPIRED, FR-19)
 * give a payment back whole. Dispute refunds are decided in payment-service itself.
 */
public record RefundRequest(
        @NotBlank @Size(max = 36) String paymentId,
        @NotNull RefundReason reason,
        @Positive long amount) {}
