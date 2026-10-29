package com.moonkage.vendor.client.dto;

import java.time.Instant;

/**
 * Answer of POST /internal/accounts/check. vendor-service stores {@code idHash}, {@code idHashKeyVer},
 * {@code idMasked}; {@code matchesAccount} tells whether the number is the owner's verified card. The owner fields
 * are null when the account is not KYC-verified ({@code kycVerified} false). {@code nfcVerifiedAt} is always null since
 * identity stopped recording the moment (identity refactor decision G1).
 */
public record CheckIdNumberResponse(
        String idHash,
        int idHashKeyVer,
        String idMasked,
        boolean matchesAccount,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt,
        boolean kycVerified) {}
