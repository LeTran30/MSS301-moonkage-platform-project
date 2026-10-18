package com.moonkage.identity.enums;

/**
 * The two system roles (Architecture Decision D-19). Owning a vendor is not a role: services look up the vendor by
 * account id.
 */
public enum Role {
    MEMBER,
    ADMIN
}
