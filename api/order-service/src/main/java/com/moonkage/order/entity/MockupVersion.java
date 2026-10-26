package com.moonkage.order.entity;

import com.moonkage.order.enums.MockupReviewStatus;
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
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Immutable mockup version; review status is the only mutable part (FR-20, FR-39, NFR-08).
 */
@Entity
@Table(name = "mockup_versions", uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "versionNo"}))
@Getter
@Setter
@NoArgsConstructor
public class MockupVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, updatable = false)
    private Integer versionNo;

    @Column(nullable = false, updatable = false)
    private String objectKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MockupReviewStatus reviewStatus = MockupReviewStatus.PENDING_REVIEW;

    @Column(columnDefinition = "TEXT")
    private String reviewNote;

    private Instant reviewedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant uploadedAt;
}
