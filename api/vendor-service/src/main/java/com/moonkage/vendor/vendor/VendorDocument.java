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
 * A file of a vendor in the private vendor-docs bucket (AC-26.1, AC-27.6). Never changed or deleted: a resubmission
 * adds a new row, and the current document of a kind is the latest one, so the admin keeps every version.
 */
@Entity
@Immutable
@Table(name = "vendor_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class VendorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DocumentKind kind;

    /** Key in the private bucket, never a URL (L-12); links are presigned when asked. */
    @Column(nullable = false)
    private String objectKey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;

    static VendorDocument of(String vendorId, DocumentKind kind, String objectKey) {
        VendorDocument document = new VendorDocument();
        document.vendorId = vendorId;
        document.kind = kind;
        document.objectKey = objectKey;
        return document;
    }
}
