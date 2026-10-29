package com.moonkage.identity.kyc.infrastructure.web.internal;

import com.moonkage.identity.kyc.application.CheckIdNumber.IdNumberCheck;
import com.moonkage.identity.profile.LegalIdentity;
import java.time.Instant;

/**
 * POST /internal/accounts/check (Software Design 4.2). vendor-service stores {@code idHash}, {@code idHashKeyVer},
 * {@code idMasked}; {@code matchesAccount} compares with the owner's verified card. The owner fields are null when
 * the owner has not passed KYC.
 *
 * @param nfcVerifiedAt always null: the moment of KYC is no longer stored (decision G1); read {@code kycVerified}
 */
record CheckIdNumberResponse(
        String idHash,
        int idHashKeyVer,
        String idMasked,
        boolean matchesAccount,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt,
        boolean kycVerified) {

    static CheckIdNumberResponse from(IdNumberCheck check) {
        LegalIdentity owner = check.owner();
        return new CheckIdNumberResponse(
                check.hash().value(),
                check.keyVersion(),
                check.masked().value(),
                check.matchesAccount(),
                owner == null ? null : owner.legalName().value(),
                owner == null ? null : owner.idNumberMasked().value(),
                null,
                owner != null);
    }
}
