package com.moonkage.api;

/**
 * The caller's role as identity-service puts it in the access token (D-19); the gateway passes it as
 * {@code X-User-Role}.
 *
 * <p>Vendor owner is not a role: it is checked per vendor, so the enum only holds the two platform-wide roles.
 */
public enum GatewayRole {
    MEMBER,
    ADMIN;

    /** The name of {@link #ADMIN}, the only role a service checks for an admin-only operation. */
    public static final String ADMIN_NAME = "ADMIN";

    /** True when the header value names the admin role; anything else (including null) is not an admin. */
    public static boolean isAdmin(String role) {
        return ADMIN_NAME.equals(role);
    }

    /** True when the header value names a role this platform knows; an unknown value means no valid token. */
    public static boolean isKnown(String role) {
        return role != null && nameOf(role) != null;
    }

    /** The role the header names, or null when it names none this platform knows. */
    public static GatewayRole nameOf(String role) {
        if (role == null) {
            return null;
        }
        for (GatewayRole candidate : values()) {
            if (candidate.name().equals(role)) {
                return candidate;
            }
        }
        return null;
    }
}
