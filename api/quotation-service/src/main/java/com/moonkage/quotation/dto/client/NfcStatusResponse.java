package com.moonkage.quotation.dto.client;

import java.time.Instant;

/**
 * identity-service GET /internal/nfc/status/{accountId}: masked data only.
 *
 * @param nfcStatus NOT_VERIFIED, VERIFIED or LOCKED
 */
public record NfcStatusResponse(String nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt) {

    private static final String VERIFIED = "VERIFIED";

    public boolean isVerified() {
        return VERIFIED.equals(nfcStatus);
    }
}
