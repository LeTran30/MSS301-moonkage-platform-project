package com.moonkage.vendor.client.dto;

import java.time.Instant;

/**
 * GET /internal/accounts/{accountId}/profile/kyc of identity-service; masked data only. Only a verified owner may
 * submit a vendor profile (BR-23).
 *
 * @param nfcStatus NOT_VERIFIED, VERIFIED or LOCKED; a string, so a status identity adds later does not break reading
 * @param nfcVerifiedAt always null since identity stopped recording the moment (identity refactor decision G1)
 * @param kycVerified whether the account passed KYC; read this, not {@code nfcStatus} or {@code nfcVerifiedAt}
 */
public record NfcStatusResponse(
        String nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt, boolean kycVerified) {

    public boolean isVerified() {
        return kycVerified;
    }
}
