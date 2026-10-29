package com.moonkage.identity.shared;

/** What an account may do. Stored by name. */
public enum Role {
    MEMBER,
    ADMIN;

    /** Longest name, for the column length. */
    public static final int MAX_NAME_LENGTH = 10;
}
