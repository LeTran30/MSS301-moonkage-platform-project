package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.ProvinceCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/**
 * One province a vendor delivers to at its own flat fee (FR-28). Part of the Vendor aggregate: changed only through
 * the vendor, which then announces its new state (vendor.updated).
 */
@Entity
@Immutable
@Table(
        name = "vendor_delivery_areas",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_vendor_delivery_areas_province",
                        columnNames = {"vendor_id", "province_code"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class DeliveryArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false, length = 2)
    private ProvinceCode provinceCode;

    static DeliveryArea of(String vendorId, ProvinceCode provinceCode) {
        DeliveryArea area = new DeliveryArea();
        area.vendorId = vendorId;
        area.provinceCode = provinceCode;
        return area;
    }
}
