package com.moonkage.vendor.security;

/**
 * Headers the gateway sets from the validated access token after stripping any the client sent (api-gateway
 * SecurityConfig). They are the only source of the caller's identity in vendor-service.
 */
public final class GatewayHeader {

    /** accounts.id, the token subject. */
    public static final String ACCOUNT_ID = "X-Account-Id";

    /** {@link Role} name. */
    public static final String USER_ROLE = "X-User-Role";

    private GatewayHeader() {}
}
