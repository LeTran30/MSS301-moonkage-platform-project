package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.WithdrawalStatus;
import java.time.Instant;

public record WithdrawalResponse(
        String id,
        String accountId,
        long amount,
        String bankBin,
        String bankName,
        String accountNumber,
        String accountName,
        WithdrawalStatus status,
        String rejectReason,
        Instant createdAt,
        Instant reviewedAt) {}
