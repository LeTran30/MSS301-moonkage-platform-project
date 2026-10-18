package com.moonkage.identity.service;

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
}
