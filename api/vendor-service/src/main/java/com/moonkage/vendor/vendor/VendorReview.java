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

/** One admin decision on a vendor profile, with what the admin confirmed having checked (AC-45.2, AC-45.5). */
@Entity
@Immutable
@Table(name = "vendor_reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class VendorReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false, length = 36)
    private String adminAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewDecision decision;

    @Column(columnDefinition = "TEXT")
    private String reason;

    /** Unit name, code, representative name and ID number compared with the licence file. */
    @Column(nullable = false)
    private boolean licenseChecked;

    /** Enterprise code looked up on the national business registration portal (A-14). */
    @Column(nullable = false)
    private boolean registryChecked;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant decidedAt;

    static VendorReview of(
            String vendorId,
            String adminAccountId,
            ReviewDecision decision,
            String reason,
            boolean licenseChecked,
            boolean registryChecked) {
        VendorReview review = new VendorReview();
        review.vendorId = vendorId;
        review.adminAccountId = adminAccountId;
        review.decision = decision;
        review.reason = reason;
        review.licenseChecked = licenseChecked;
        review.registryChecked = registryChecked;
        return review;
    }
}
