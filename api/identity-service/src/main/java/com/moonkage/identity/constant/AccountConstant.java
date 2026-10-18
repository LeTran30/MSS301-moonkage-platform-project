package com.moonkage.identity.constant;

/** Account input limits (FR-01), shared by the request DTOs and the user_profiles column. */
public final class AccountConstant {

    public static final int MAX_FULL_NAME_LENGTH = 100;

    public static final int PASSWORD_MIN_LENGTH = 8;

    /** BCrypt only reads the first 72 bytes: a longer password would be silently cut. */
    public static final int PASSWORD_MAX_LENGTH = 72;

    private AccountConstant() {}
}
