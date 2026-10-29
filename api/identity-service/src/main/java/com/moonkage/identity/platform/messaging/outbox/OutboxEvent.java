package com.moonkage.identity.platform.messaging.outbox;

import com.moonkage.identity.platform.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

/**
 * An event written in the same transaction as the data it describes (Software Design 6, NFR-05), then sent to
 * RabbitMQ by OutboxRelay. A crash between the two never loses the event; at worst it is sent twice, and consumers
 * skip a repeated {@code id}.
 */
@Entity
@Table(name = "outbox_events", indexes = @Index(name = "ix_outbox_events_unpublished", columnList = "published_at"))
class OutboxEvent extends BaseEntity {

    /** = the event's own eventId, also sent as the AMQP message id. Varchar until phase 8b. */
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "routing_key", nullable = false, length = 100, updatable = false)
    private String routingKey;

    /** The event as JSON, exactly as it goes on the wire. */
    @Column(name = "payload", nullable = false, columnDefinition = "TEXT", updatable = false)
    private String payload;

    /** Null until the broker confirmed it. */
    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    protected OutboxEvent() {}

    private OutboxEvent(EventId id, String routingKey, String payload) {
        this.id = Objects.requireNonNull(id, "id").toString();
        this.routingKey = Objects.requireNonNull(routingKey, "routingKey");
        this.payload = Objects.requireNonNull(payload, "payload");
    }

    /** Not sent yet, no attempt made. */
    static OutboxEvent record(EventId id, String routingKey, String payload) {
        return new OutboxEvent(id, routingKey, payload);
    }

    void markPublished(Instant timestamp) {
        this.publishedAt = Objects.requireNonNull(timestamp, "timestamp");
    }

    void incrementAttempts() {
        this.attempts++;
    }

    String getId() {
        return id;
    }

    String getRoutingKey() {
        return routingKey;
    }

    String getPayload() {
        return payload;
    }

    Instant getPublishedAt() {
        return publishedAt;
    }

    int getAttempts() {
        return attempts;
    }
}
