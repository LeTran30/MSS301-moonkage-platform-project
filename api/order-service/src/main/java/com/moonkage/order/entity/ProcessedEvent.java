package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/** An event from another service that was handled; a redelivery of the same eventId is skipped (NFR-05). */
@Entity
@Immutable
@Table(name = "processed_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcessedEvent {

    @Id
    @Column(length = 64)
    private String eventId;

    @Column(nullable = false, length = 100)
    private String routingKey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant processedAt;

    public static ProcessedEvent of(String eventId, String routingKey) {
        ProcessedEvent event = new ProcessedEvent();
        event.eventId = eventId;
        event.routingKey = routingKey;
        return event;
    }
}
