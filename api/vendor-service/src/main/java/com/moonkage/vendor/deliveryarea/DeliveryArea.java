package com.moonkage.vendor.deliveryarea;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
class DeliveryArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** vendors.id; a link by id, not a JPA relation, because vendors belongs to the vendor component (FK in the DB). */
    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false, length = 2)
    private String provinceCode;
}
