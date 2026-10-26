package com.moonkage.vendor.client.dto;

import java.time.Instant;

/** GET /internal/nfc/status/{accountId} of identity-service; masked data only. */
public record NfcStatusResponse(NfcStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt) {

    public boolean isVerified() {
        return nfcStatus == NfcStatus.VERIFIED;
    }
}
