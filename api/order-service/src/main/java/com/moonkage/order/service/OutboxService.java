package com.moonkage.order.service;

import com.moonkage.order.dto.event.EventEnvelope;
import com.moonkage.order.enums.AggregateType;

/** Records a domain event inside the current transaction (Software Design 6); OutboxRelay sends it later. */
public interface OutboxService {

    /**
     * Must run inside the transaction that changes the data the event describes, so both commit or neither does.
     *
     * @param eventId the event's own id, kept as the outbox row id and the AMQP message id
     */
    void enqueue(String eventId, String routingKey, Object event);

    /**
     * Enqueues {@code data} wrapped in an {@link EventEnvelope} (contract catalog v1);
     * same transaction rule as {@link #enqueue}.
     *
     * @return the new event's id
     */
    String enqueueState(
            String routingKey, AggregateType aggregateType, String aggregateId, long sourceVersion, Object data);
}
