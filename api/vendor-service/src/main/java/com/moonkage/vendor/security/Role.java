package com.moonkage.vendor.security;

/** The caller's role as identity-service puts it in the access token (D-19); the gateway passes it as X-User-Role. */
public enum Role {
    MEMBER,
    ADMIN
}
