package com.moonkage.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An event written in the same transaction as the data it describes (Software Design 6, NFR-05), then sent to
 * RabbitMQ by OutboxRelay. A crash between the two never loses the event; at worst it is sent twice, and consumers
 * skip a repeated {@code id}.
 */
@Entity
@Table(name = "outbox_events", indexes = @Index(name = "ix_outbox_events_unpublished", columnList = "published_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent extends BaseEntity {

    /** = the event's own eventId, also sent as the AMQP message id. */
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "routing_key", nullable = false, length = 100)
    private String routingKey;

    /** The event as JSON, exactly as it goes on the wire. */
    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    /** Null until the broker confirmed it. */
    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "attempts", nullable = false)
    @Builder.Default
    private int attempts = 0;
}
