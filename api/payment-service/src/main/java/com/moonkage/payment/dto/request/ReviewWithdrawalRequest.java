package com.moonkage.payment.dto.request;

import com.moonkage.payment.enums.WithdrawalStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/wallets/withdrawals/{id}: the admin marks a withdrawal COMPLETED once the bank transfer is done, or
 * REJECTED with a reason the buyer reads (the money goes back to the wallet).
 */
public record ReviewWithdrawalRequest(
        @NotNull WithdrawalStatus status, @Size(max = 2000) String reason) {}
