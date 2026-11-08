package com.moonkage.api;

/**
 * The headers the gateway sets from the validated access token, after stripping any the client sent
 * (api-gateway {@code SecurityConfig}).
 *
 * <p>They are the only source of the caller's identity in a service: a request that did not come through the
 * gateway with a valid token carries neither, and the service answers 401 rather than trusting the body.
 */
public final class GatewayHeader {

    /** accounts.id, the token subject. */
    public static final String ACCOUNT_ID = "X-Account-Id";

    /** The {@link GatewayRole} name. */
    public static final String USER_ROLE = "X-User-Role";

    /** No longer set; still stripped so a client cannot smuggle it to a service that reads it. */
    public static final String USER_ID = "X-User-Id";

    private GatewayHeader() {
        throw new AssertionError("no instances");
    }
}
