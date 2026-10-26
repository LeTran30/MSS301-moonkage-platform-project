package com.moonkage.vendor.outbox;

/** Records a domain event inside the current transaction (Software Design 6); OutboxRelay sends it later. */
public interface OutboxService {

    /**
     * Must run inside the transaction that changes the data the event describes, so both commit or neither does.
     *
     * @param eventId the event's own id, kept as the outbox row id and the AMQP message id
     * @param routingKey routing key on the {@code moonkage.events} exchange
     * @param event serialized to JSON as is
     */
    void enqueue(String eventId, String routingKey, Object event);

    /**
     * Records the new state of an aggregate in an {@link EventEnvelope}, under a new event id. Same transaction rule
     * as {@link #enqueue}.
     *
     * @param sourceVersion the aggregate's version after this change, as it will be committed
     * @param data the full state
     * @return the event id
     */
    String enqueueState(
            String routingKey, AggregateType aggregateType, String aggregateId, long sourceVersion, Object data);
}
