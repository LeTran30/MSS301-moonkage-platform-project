package com.bake2b.order.entity;

import com.bake2b.order.enums.*;
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
 * Immutable progress history entry (FR-21, FR-40).
 */
@Entity
@Table(name = "progress_updates")
@Getter
@Setter
@NoArgsConstructor
public class ProgressUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus milestone;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ElementCollection
    @CollectionTable(name = "progress_update_photos", joinColumns = @JoinColumn(name = "progress_update_id"))
    @Column(name = "file_url", nullable = false)
    private List<String> photoUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
