package com.moonkage.vendor.client.dto;

import java.time.Instant;

/** GET /internal/accounts/{accountId}/profile/kyc of identity-service; masked data only. */
public record NfcStatusResponse(NfcStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt) {

    public boolean isVerified() {
        return nfcStatus == NfcStatus.VERIFIED;
    }
}
