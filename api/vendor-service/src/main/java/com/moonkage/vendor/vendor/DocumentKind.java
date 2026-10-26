package com.moonkage.vendor.vendor;

import java.util.Set;

/** Files kept for a vendor in the private vendor-docs bucket (AC-26.1, AC-27.6). */
public enum DocumentKind {
    BUSINESS_LICENSE,
    FOOD_SAFETY,
    /** Attached by an admin after the registration fee is paid (Q-36); never by the owner. */
    FEE_INVOICE;

    /** What the owner sends with every submission (AC-26.1). */
    public static final Set<DocumentKind> SUBMITTED_BY_OWNER = Set.of(BUSINESS_LICENSE, FOOD_SAFETY);
}
