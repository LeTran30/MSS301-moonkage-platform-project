package com.moonkage.payment.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * POST /api/wallets/me/withdrawals: send wallet money to a bank account (Q-01). {@code bankBin} is one of the
 * VietQR list (GET /api/wallets/banks); the bank's name is taken from that list.
 *
 * @param amount whole VND, at least {@link #MIN_AMOUNT}
 * @param accountName as on the bank account: upper case letters without accents and spaces
 */
public record CreateWithdrawalRequest(
        @Min(MIN_AMOUNT) long amount,
        @NotBlank @Pattern(regexp = "\\d{6,10}") String bankBin,
        @NotBlank @Pattern(regexp = "\\d{6,19}") String accountNumber,

        @NotBlank @Size(max = 100) @Pattern(regexp = "[A-Z ]+")
        String accountName) {

    public static final long MIN_AMOUNT = 10_000L;
}
