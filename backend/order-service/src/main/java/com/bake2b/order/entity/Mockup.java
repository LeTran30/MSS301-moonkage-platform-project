package com.bake2b.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a design mockup for a custom mooncake order.
 */
@Entity
@Table(name = "mockups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mockup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String orderId;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String designNotes;

    private String status;

    private String feedbackNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING_REVIEW";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
