package com.bake2b.catalog.entity;

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
 * Area a vendor delivers to (FR-29). Kept here because product search and request matching filter on it.
 */
@Entity
@Table(name = "vendor_delivery_areas", uniqueConstraints = @UniqueConstraint(columnNames = {"vendorId", "areaCode"}))
@Getter
@Setter
@NoArgsConstructor
public class DeliveryArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String areaCode;
}
