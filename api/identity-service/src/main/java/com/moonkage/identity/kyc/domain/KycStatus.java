package com.moonkage.identity.kyc.domain;

/** KYC standing of an account (Requirement 7.1 nfc_status); the names are sent as they are. */
public enum KycStatus {
    NOT_VERIFIED,
    VERIFIED,
    LOCKED
}
