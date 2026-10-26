package com.moonkage.vendor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Province (Q-12, L-15) a vendor delivers to (FR-28). catalog and quotation will filter on a copy of it
 * (vendor snapshot, Software Design 4.1).
 */
@Entity
@Table(
        name = "vendor_delivery_areas",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_vendor_delivery_areas_province",
                        columnNames = {"vendor_id", "province_code"}))
@Getter
@Setter
@NoArgsConstructor
public class DeliveryArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(nullable = false, length = 2)
    private String provinceCode;
}
