package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.ReviewDecision;
import java.time.Instant;

public record VendorReviewResponse(
        String id,
        String adminAccountId,
        ReviewDecision decision,
        String reason,
        boolean licenseChecked,
        boolean registryChecked,
        Instant decidedAt) {}
