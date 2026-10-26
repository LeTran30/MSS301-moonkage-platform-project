package com.moonkage.quotation.common;

/** The role claim the gateway passes as X-User-Role. Vendor owner is not a role (D-19): it is checked per vendor. */
public final class Roles {

    public static final String ADMIN = "ADMIN";

    private Roles() {}

    public static boolean isAdmin(String role) {
        return ADMIN.equals(role);
    }
}
