package com.bake2b.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a production progress update from the vendor.
 */
@Entity
@Table(name = "production_updates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String orderId;

    private String vendorId;

    private String stage;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    private Integer percentComplete;

    private LocalDateTime reportedAt;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
    }
}
