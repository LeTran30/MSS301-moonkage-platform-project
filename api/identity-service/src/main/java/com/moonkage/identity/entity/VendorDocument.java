package com.moonkage.identity.entity;

import com.moonkage.identity.enums.VendorDocumentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Uploaded legal document of a vendor; visible to owner and admin only (NFR-03).
 */
@Entity
@Table(name = "vendor_documents")
@Getter
@Setter
@NoArgsConstructor
public class VendorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorDocumentType type;

    @Column(nullable = false)
    private String fileUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
