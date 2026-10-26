package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;

public record VendorReviewResponse(
        String id,
        String adminAccountId,
        String decision,
        String reason,
        boolean licenseChecked,
        boolean registryChecked,
        Instant decidedAt) {}
