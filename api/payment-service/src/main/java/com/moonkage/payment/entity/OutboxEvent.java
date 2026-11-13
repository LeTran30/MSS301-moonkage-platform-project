package com.moonkage.payment.entity;

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
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * An event written in the same transaction as the data it describes (Software Design 6, NFR-05), then sent to
 * RabbitMQ by OutboxRelay. A crash between the two never loses the event; at worst it is sent twice, and consumers
 * skip a repeated id.
 */
@Entity
@Table(name = "outbox_events")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class OutboxEvent {

    /** = the event's own eventId, also sent as the AMQP message id. */
    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(name = "routing_key", nullable = false, length = 100, updatable = false)
    private String routingKey;

    /** The event as JSON, exactly as it goes on the wire. */
    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    private String payload;

    /** BE-11: the W3C traceparent of the request that wrote the event; null when it was written outside a request. */
    @Column(name = "trace_parent", length = 55, updatable = false)
    private String traceParent;

    /** Null until the broker confirmed it. */
    private Instant publishedAt;

    @Column(nullable = false)
    private int attempts;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
