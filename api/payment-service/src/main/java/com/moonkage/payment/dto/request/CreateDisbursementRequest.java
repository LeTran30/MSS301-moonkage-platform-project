package com.moonkage.payment.dto.request;

import com.moonkage.payment.enums.DisbursementPurpose;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** FR-41: how much of the deposit, for what. */
public record CreateDisbursementRequest(
        @Positive long amount, @NotNull DisbursementPurpose purpose) {}
