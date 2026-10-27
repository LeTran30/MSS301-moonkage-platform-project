package com.moonkage.payment.dto.request;

import com.moonkage.payment.enums.PaymentPurpose;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Body of POST /internal/payments, sent by the root that owns the payment (payment.md): order (CHECKOUT, REMAINDER),
 * quotation (DEPOSIT), vendor (REGISTRATION_FEE).
 *
 * @param referenceId checkoutId, acceptanceId, orderId or vendorId, by purpose
 * @param amount whole VND
 * @param expiresAt the payer must pay before this (P-01); null takes the default lifetime
 * @param allocations CHECKOUT only: the share of each order, ids issued with the checkout (BR-29). DEPOSIT and
 *     REMAINDER go wholly to one order, REGISTRATION_FEE to none, so they send none
 */
public record CreatePaymentRequest(
        @NotNull PaymentPurpose purpose,
        @NotBlank @Size(max = 36) String referenceId,
        @NotBlank @Size(max = 36) String payerAccountId,
        @Positive long amount,
        Instant expiresAt,
        @Valid List<AllocationRequest> allocations) {

    /** @param amount whole VND of the order's share */
    public record AllocationRequest(
            @NotBlank @Size(max = 36) String orderId,
            @Positive long amount) {}
}
