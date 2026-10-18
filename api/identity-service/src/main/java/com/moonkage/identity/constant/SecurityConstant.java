package com.moonkage.identity.constant;

public final class SecurityConstant {

    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String ROLE_PREFIX = "ROLE_";

    public static final String TOKEN_TYPE_ACCESS = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";

    public static final String CLAIM_TYPE = "type";
    public static final String CLAIM_ROLE = "role";

    private SecurityConstant() {}
}
