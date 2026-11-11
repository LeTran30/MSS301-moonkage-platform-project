package com.moonkage.payment.dto.response;

/**
 * GET /api/wallets/summary (admin): what the platform owes buyers in their wallets, and the withdrawals waiting for a
 * bank transfer.
 */
public record WalletSummaryResponse(long totalBalance, long pendingWithdrawals, long pendingWithdrawalAmount) {}
