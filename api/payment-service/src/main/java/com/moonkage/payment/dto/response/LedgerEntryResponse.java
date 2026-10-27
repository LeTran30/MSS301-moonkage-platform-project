package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.LedgerEntryKind;
import java.time.Instant;

public record LedgerEntryResponse(
        LedgerEntryKind kind, long amount, String referenceId, String actorAccountId, Instant createdAt) {}
