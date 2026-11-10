package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/** An event from another service that was handled; a redelivery of the same eventId is skipped (NFR-05). */
@Entity
@Immutable
@Table(name = "processed_events")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProcessedEvent {

    @Id
    @Column(length = 64)
    private String eventId;

    @Column(nullable = false, length = 100)
    private String routingKey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant processedAt;
}
