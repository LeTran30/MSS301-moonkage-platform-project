package com.moonkage.identity.enums;

/**
 * What an OTP was sent for. A code only works for its own purpose: a registration code must not reset a password,
 * and the other way round.
 */
public enum OtpPurpose {
    VERIFY_ACCOUNT,
    RESET_PASSWORD
}
