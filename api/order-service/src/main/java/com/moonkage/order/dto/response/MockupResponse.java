package com.moonkage.order.dto.response;

import com.moonkage.order.enums.MockupReviewStatus;
import java.time.Instant;

/** @param downloadUrl short-lived link to the file */
public record MockupResponse(
        int versionNo,
        String downloadUrl,
        MockupReviewStatus reviewStatus,
        String reviewNote,
        Instant uploadedAt,
        Instant reviewedAt) {}
