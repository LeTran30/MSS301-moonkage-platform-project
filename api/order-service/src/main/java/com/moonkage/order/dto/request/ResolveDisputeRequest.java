package com.moonkage.order.dto.request;

import com.moonkage.order.enums.DisputeDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * FR-49: the admin decides. A full refund gives back the order total; a partial one {@code refundAmount}, taken from
 * what the platform still holds (payment-service checks it, Q-01).
 */
public record ResolveDisputeRequest(
        @NotNull DisputeDecision decision,
        Long refundAmount,
        @NotBlank @Size(max = 2000) String decisionReason) {}
