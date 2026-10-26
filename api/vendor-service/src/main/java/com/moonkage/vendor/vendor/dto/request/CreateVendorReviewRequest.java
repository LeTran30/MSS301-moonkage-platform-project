package com.moonkage.vendor.vendor.dto.request;

import com.moonkage.vendor.vendor.ReviewDecision;
import jakarta.validation.constraints.NotNull;

/**
 * An admin's decision on a pending profile (FR-45).
 *
 * @param reason required unless {@code decision = APPROVE} (AC-45.2)
 * @param licenseChecked required to approve: unit name, code, representative name and ID number compared with the
 *     licence file (AC-45.5)
 * @param registryChecked required to approve a sole proprietorship: enterprise code looked up on the national
 *     business registration portal (AC-45.5, A-14)
 */
public record CreateVendorReviewRequest(
        @NotNull(message = "{validation.required}") ReviewDecision decision,
        String reason,
        boolean licenseChecked,
        boolean registryChecked) {}
