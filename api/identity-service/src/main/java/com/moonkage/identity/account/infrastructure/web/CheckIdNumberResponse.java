package com.moonkage.identity.account.infrastructure.web;

import com.moonkage.identity.profile.IdNumberCheck;
import com.moonkage.identity.profile.ProfileKyc;
import java.time.Instant;

/**
 * POST /internal/accounts/{accountId}/profile/kyc/id-number-check (Software Design 4.2). vendor-service stores
 * {@code idHash}, {@code idHashKeyVer}, {@code idMasked}; {@code matchesAccount} compares with the owner's verified
 * card. The owner fields are null when the owner has not passed KYC.
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
        ProfileKyc owner = check.owner();
        boolean verified = owner.isVerified();
        return new CheckIdNumberResponse(
                check.hash().value(),
                check.keyVersion(),
                check.masked().value(),
                check.matchesProfile(),
                verified ? owner.legalName().value() : null,
                verified ? owner.idNumberMasked().value() : null,
                null,
                verified);
    }
}
