package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;

/** Owner check of one submission (AC-26.8, AC-45.4). */
public record OwnerCheckResponse(
        int submissionNo,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt,
        boolean idMatch,
        String nameMatch,
        Instant checkedAt) {}
