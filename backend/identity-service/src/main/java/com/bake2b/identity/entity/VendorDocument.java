package com.bake2b.identity.entity;

import com.bake2b.identity.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

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
