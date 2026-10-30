package com.moonkage.quotation.dto.client;

import java.time.Instant;

/**
 * identity-service GET /internal/accounts/{accountId}/profile/kyc: masked data only.
 *
 * @param nfcStatus NOT_VERIFIED, VERIFIED or LOCKED
 * @param nfcVerifiedAt always null since identity stopped recording the moment (identity refactor decision G1)
 * @param kycVerified whether the account passed KYC; read this, not {@code nfcStatus} or {@code nfcVerifiedAt}
 */
public record NfcStatusResponse(
        String nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt, boolean kycVerified) {

    public boolean isVerified() {
        return kycVerified;
    }
}
