package com.moonkage.identity.kyc.domain.nfc;

/** What a live session reports; the names are sent as they are. An expired session answers 410 instead. */
public enum NfcSessionStatus {
    PENDING,
    VERIFIED
}
