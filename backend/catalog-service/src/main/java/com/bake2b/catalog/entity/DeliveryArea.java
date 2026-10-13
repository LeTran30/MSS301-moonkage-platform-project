package com.bake2b.catalog.entity;

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
 * Area a vendor delivers to (FR-29). Kept here because product search and request matching filter on it.
 */
@Entity
@Table(name = "vendor_delivery_areas",
        uniqueConstraints = @UniqueConstraint(columnNames = {"vendorId", "areaCode"}))
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
