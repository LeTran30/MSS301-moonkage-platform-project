package com.moonkage.vendor.vendor.dto.request;

/** @param reason required unless {@code decision = APPROVE} (AC-45.5) */
public record CreateVendorReviewRequest(
        String decision, String reason, boolean licenseChecked, boolean registryChecked) {}
