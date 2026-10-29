package com.moonkage.identity.security;

public final class SecurityConstant {

    public static final String TOKEN_TYPE_ACCESS = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";

    public static final String CLAIM_TYPE = "type";
    public static final String CLAIM_ROLE = "role";

    /** Shown in place of passwords and tokens in toString(), so they never reach the logs. */
    public static final String REDACTED = "***";

    private SecurityConstant() {}
}
