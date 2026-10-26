package com.moonkage.vendor.client.dto;

import java.time.Instant;

/**
 * Answer of POST /internal/accounts/check. vendor-service stores {@code idHash}, {@code idHashKeyVer},
 * {@code idMasked}; {@code matchesAccount} tells whether the number is the owner's verified card. The owner fields
 * are null when the account is not NFC-verified.
 */
public record CheckIdNumberResponse(
        String idHash,
        int idHashKeyVer,
        String idMasked,
        boolean matchesAccount,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt) {}
