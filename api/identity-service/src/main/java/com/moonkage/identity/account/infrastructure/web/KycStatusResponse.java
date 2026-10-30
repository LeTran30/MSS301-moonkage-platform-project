package com.moonkage.identity.account.infrastructure.web;

import com.moonkage.identity.profile.KycStatus;
import com.moonkage.identity.profile.ProfileKyc;
import java.time.Instant;

/**
 * KYC standing of an account, for itself (GET /api/accounts/me/profile/kyc) and for other services (GET
 * /internal/accounts/{accountId}/profile/kyc, BR-23, AC-45.1). Masked data only.
 *
 * @param nfcVerifiedAt always null: the moment of KYC is no longer stored (decision G1); read {@code kycVerified}
 */
public record KycStatusResponse(
        KycStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt, boolean kycVerified) {

    public static KycStatusResponse from(ProfileKyc kyc) {
        return kyc.isVerified()
                ? new KycStatusResponse(
                        kyc.status(),
                        kyc.legalName().value(),
                        kyc.idNumberMasked().value(),
                        null,
                        true)
                : new KycStatusResponse(kyc.status(), null, null, null, false);
    }
}
