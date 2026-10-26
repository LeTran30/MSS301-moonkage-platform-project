package com.moonkage.vendor.vendor;

import java.util.Set;

/** Vendor review and lock state (Requirement 7.1; FR-27, FR-45, FR-46). */
public enum VendorStatus {
    PENDING,
    NEEDS_INFO,
    APPROVED,
    REJECTED,
    LOCKED;

    /**
     * The only moves a vendor makes: a review decides a pending profile (FR-45), the owner resubmits after NEEDS_INFO
     * or REJECTED (AC-27.2), the admin locks an approved vendor (FR-46). Unlocking is not a requirement.
     */
    public boolean canTransitionTo(VendorStatus target) {
        return switch (this) {
            case PENDING -> Set.of(APPROVED, NEEDS_INFO, REJECTED).contains(target);
            case NEEDS_INFO, REJECTED -> target == PENDING;
            case APPROVED -> target == LOCKED;
            case LOCKED -> false;
        };
    }
}
