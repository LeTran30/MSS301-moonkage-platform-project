package com.moonkage.vendor.vendor;

/** A-15: the declared representative name against the name on the owner's ID card. Two levels, no fuzzy match. */
public enum NameMatch {
    MATCH,
    MISMATCH;

    public static NameMatch of(boolean matches) {
        return matches ? MATCH : MISMATCH;
    }
}
