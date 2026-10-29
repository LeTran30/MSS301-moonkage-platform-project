package com.moonkage.identity.kyc.infrastructure.web;

import com.moonkage.identity.kyc.application.GetKycStatus.AccountKyc;
import com.moonkage.identity.kyc.domain.KycStatus;
import com.moonkage.identity.profile.LegalIdentity;
import java.time.Instant;

/**
 * KYC standing of an account, for itself (GET /api/nfc/status) and for other services (GET /internal/nfc/status/{id},
 * BR-23, AC-45.1). Masked data only.
 *
 * @param nfcVerifiedAt always null: the moment of KYC is no longer stored (decision G1); read {@code kycVerified}
 */
public record KycStatusResponse(
        KycStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt, boolean kycVerified) {

    public static KycStatusResponse from(AccountKyc kyc) {
        LegalIdentity identity = kyc.identity();
        return identity == null
                ? new KycStatusResponse(kyc.status(), null, null, null, false)
                : new KycStatusResponse(
                        kyc.status(),
                        identity.legalName().value(),
                        identity.idNumberMasked().value(),
                        null,
                        true);
    }
}
