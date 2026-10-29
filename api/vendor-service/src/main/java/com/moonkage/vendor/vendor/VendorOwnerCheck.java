package com.moonkage.vendor.vendor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/**
 * What the declared representative was compared with at one submission (AC-26.8, AC-45.4): the owner's verified ID
 * card as identity-service knew it then. One immutable row per submission, numbered from 1.
 */
@Entity
@Immutable
@Table(name = "vendor_owner_checks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class VendorOwnerCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private int submissionNo;

    /** Name on the owner's ID card (identity-service), not what was declared. */
    @Column(nullable = false, length = 100)
    private String ownerLegalName;

    @Column(nullable = false, length = 12)
    private String ownerIdMasked;

    /** Null for checks made since identity stopped recording when the card was verified (decision G1). */
    private Instant nfcVerifiedAt;

    /** The declared ID number is the owner's card (BR-27); a submission without a match is refused, never stored. */
    @Column(nullable = false)
    private boolean idMatch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NameMatch nameMatch;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant checkedAt;

    static VendorOwnerCheck of(String vendorId, int submissionNo, OwnerCard ownerCard, NameMatch nameMatch) {
        VendorOwnerCheck check = new VendorOwnerCheck();
        check.vendorId = vendorId;
        check.submissionNo = submissionNo;
        check.ownerLegalName = ownerCard.legalName();
        check.ownerIdMasked = ownerCard.idNumberMasked();
        check.nfcVerifiedAt = ownerCard.nfcVerifiedAt();
        check.idMatch = ownerCard.matchesDeclaredIdNumber();
        check.nameMatch = nameMatch;
        return check;
    }
}
