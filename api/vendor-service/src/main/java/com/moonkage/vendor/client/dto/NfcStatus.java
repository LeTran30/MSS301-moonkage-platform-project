package com.moonkage.vendor.client.dto;

/** identity-service's NfcStatus (Requirement 7.1): only VERIFIED may submit a vendor profile (BR-23). */
public enum NfcStatus {
    NOT_VERIFIED,
    VERIFIED,
    LOCKED
}
