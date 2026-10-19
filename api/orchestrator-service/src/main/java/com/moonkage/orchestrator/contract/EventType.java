package com.moonkage.orchestrator.contract;

public enum EventType {
    EMAIL,
    IN_APP,
    AUDIT,
    /** identity-service account.nfc_*: pushed to the web and audited. */
    NFC_VERIFICATION
}
