package com.moonkage.payment.dto.response;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.enums.WalletEntryKind;
import com.moonkage.payment.enums.WalletEntryReason;
import java.time.Instant;

/** GET /api/wallets/me: the balance and one page of its history, newest first. */
public record WalletResponse(long balance, PageResponse<Entry> entries) {

    public record Entry(
            String id,
            WalletEntryKind kind,
            WalletEntryReason reason,
            long amount,
            String referenceId,
            Instant createdAt) {}
}
