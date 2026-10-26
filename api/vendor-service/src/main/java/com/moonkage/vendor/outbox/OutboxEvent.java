package com.moonkage.vendor.outbox;

import com.moonkage.vendor.common.BaseEntity;
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

/**
 * An event written in the same transaction as the data it describes (Software Design 6, NFR-05), then sent to
 * RabbitMQ by OutboxRelay. A crash between the two never loses the event; at worst it is sent twice, and consumers
 * skip a repeated {@code id}.
 */
@Entity
@Table(name = "outbox_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PACKAGE)
@Builder
class OutboxEvent extends BaseEntity {

    /** = the event's own eventId, also sent as the AMQP message id. */
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
    @Builder.Default
    private int attempts = 0;

    void markPublished(Instant timestamp) {
        this.publishedAt = timestamp;
    }

    void incrementAttempts() {
        this.attempts++;
    }
}
