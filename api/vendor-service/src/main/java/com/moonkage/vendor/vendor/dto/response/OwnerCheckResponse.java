package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.NameMatch;
import java.time.Instant;

/**
 * Owner check of one submission (AC-26.8, AC-45.4): the owner's verified ID card at that time and how the declared
 * representative compares with it. A MISMATCH name is shown to the admin as a warning.
 */
public record OwnerCheckResponse(
        int submissionNo,
        String ownerLegalName,
        String ownerIdMasked,
        Instant nfcVerifiedAt,
        boolean idMatch,
        NameMatch nameMatch,
        Instant checkedAt) {}
