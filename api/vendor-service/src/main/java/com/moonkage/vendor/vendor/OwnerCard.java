package com.moonkage.vendor.vendor;

import java.time.Instant;

/**
 * The owner's NFC-verified ID card as identity-service reports it when a profile is submitted (AC-45.1), whether the
 * declared ID number is that card (BR-27), and the declared number in the forms vendor-service keeps.
 */
record OwnerCard(
        String legalName,
        String idNumberMasked,
        Instant nfcVerifiedAt,
        boolean matchesDeclaredIdNumber,
        HashedIdNumber declaredIdNumber) {}
