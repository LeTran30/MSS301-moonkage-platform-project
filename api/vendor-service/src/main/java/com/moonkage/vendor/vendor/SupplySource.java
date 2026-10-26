package com.moonkage.vendor.vendor;

/** Where the vendor's goods come from (AC-26.2); decides which order terms it must give (AC-35.2, AC-35.3). */
public enum SupplySource {
    SELF_PRODUCED,
    RESELL,
    BOTH;

    public boolean produces() {
        return this != RESELL;
    }

    public boolean resells() {
        return this != SELF_PRODUCED;
    }
}
