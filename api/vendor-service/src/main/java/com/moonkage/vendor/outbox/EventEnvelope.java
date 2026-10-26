package com.moonkage.vendor.outbox;

import java.time.Instant;

/**
 * The wrapper of a state event read by other services' copies (docs/services/catalog/contract-proposal.md, section
 * 2): who and which version on the outside, the state itself in {@code data}.
 *
 * @param eventType the routing key; a consumer checks it against the key it received the message on
 * @param sourceVersion the aggregate's version after the change; grows within one aggregate only
 * @param occurredAt when the producer wrote the event; for audit, never for ordering
 * @param data the full state, every field present even when null
 */
public record EventEnvelope<T>(
        String eventId,
        int schemaVersion,
        String eventType,
        String sourceService,
        AggregateType aggregateType,
        String aggregateId,
        long sourceVersion,
        Instant occurredAt,
        T data) {

    /** Bumped only when the meaning of a field changes; a new field does not need it. */
    public static final int SCHEMA_VERSION = 1;
}
