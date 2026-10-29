package com.moonkage.identity.account.atom;

/**
 * Limits of a raw password (FR-01, FR-02): {@link PasswordHash#fromRawPassword} enforces them, the register and reset
 * request DTOs repeat them for a friendly 400.
 */
public final class PasswordConstant {

    public static final int MIN_LENGTH = 8;

    /** BCrypt only reads the first 72 bytes: a longer password would be silently cut. */
    public static final int MAX_LENGTH = 72;

    private PasswordConstant() {}
}
