package com.moonkage.payment.dto.request;

import com.moonkage.payment.enums.DisbursementStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * FR-47: APPROVED (all, or {@code approvedAmount} of it) or REJECTED with a reason.
 *
 * @param approvedAmount null approves the whole amount asked
 */
public record ReviewDisbursementRequest(
        @NotNull DisbursementStatus status,
        Long approvedAmount,
        @Size(max = 2000) String reason) {}
