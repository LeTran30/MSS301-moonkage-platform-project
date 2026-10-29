package com.moonkage.identity.platform.security;

/**
 * Who a bearer token belongs to (plan v2, 6.1). Platform only reads the header; the module that issues tokens
 * implements this, so the filter knows neither JWT nor accounts.
 */
public interface BearerTokenAuthenticator {

    /**
     * @param token the header value without the {@code Bearer } prefix
     * @return the caller, checked against the current state of their account
     * @throws com.moonkage.identity.shared.error.AppException when the token is invalid or expired, or the account no
     *     longer accepts it
     */
    CurrentUserInfo authenticate(String token);
}
