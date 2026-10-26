package com.moonkage.identity.account;

/** Password limits (FR-01, FR-02), shared by the register and reset request DTOs. */
public final class AccountConstant {

    public static final int PASSWORD_MIN_LENGTH = 8;

    /** BCrypt only reads the first 72 bytes: a longer password would be silently cut. */
    public static final int PASSWORD_MAX_LENGTH = 72;

    private AccountConstant() {}
}
