package com.moonkage.identity.kyc;

/** What GET /api/nfc/sessions/{sessionId} reports; an expired session answers 410 instead. */
public enum NfcSessionStatus {
    PENDING,
    VERIFIED
}
