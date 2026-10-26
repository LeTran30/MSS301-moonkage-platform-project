package com.moonkage.quotation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** An event written in the business transaction; a relay publishes it to moonkage.events later (NFR-05). */
@Entity
@Table(name = "outbox_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OutboxEvent {

    /** = the event's own eventId. */
    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(name = "routing_key", nullable = false, length = 100, updatable = false)
    private String routingKey;

    /** The event as JSON, exactly as it goes on the wire. */
    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    private String payload;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(nullable = false)
    private int attempts;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static OutboxEvent of(String eventId, String routingKey, String payload) {
        OutboxEvent event = new OutboxEvent();
        event.id = eventId;
        event.routingKey = routingKey;
        event.payload = payload;
        return event;
    }
}
