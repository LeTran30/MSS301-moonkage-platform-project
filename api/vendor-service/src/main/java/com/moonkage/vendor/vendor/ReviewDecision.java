package com.moonkage.vendor.vendor;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** An admin's decision on a pending vendor profile (FR-45) and the status it moves the vendor to. */
@Getter
@RequiredArgsConstructor
public enum ReviewDecision {
    APPROVE(VendorStatus.APPROVED),
    NEEDS_INFO(VendorStatus.NEEDS_INFO),
    REJECT(VendorStatus.REJECTED);

    private final VendorStatus resultingStatus;

    /** AC-45.2: asking for more information or rejecting needs a reason the owner will read. */
    public boolean requiresReason() {
        return this != APPROVE;
    }
}
