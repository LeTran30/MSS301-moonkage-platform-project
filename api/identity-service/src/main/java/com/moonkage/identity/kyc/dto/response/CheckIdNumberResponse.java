package com.moonkage.identity.kyc.dto.response;

import java.time.Instant;

/**
 * POST /internal/accounts/check (Software Design 4.2). vendor-service stores {@code idHash},
 * {@code idHashKeyVer}, {@code idMasked}; {@code matchesAccount} compares with the owner's verified ID card. The
 * owner fields are null when the account is not NFC-verified.
 */
public record CheckIdNumberResponse(
        String idHash,
        int idHashKeyVer,
        String idMasked,
        boolean matchesAccount,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt) {}
