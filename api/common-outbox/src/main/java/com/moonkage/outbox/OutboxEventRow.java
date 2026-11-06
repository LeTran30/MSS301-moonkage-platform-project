package com.moonkage.outbox;

/**
 * One row of the outbox of a service, as the relay needs it: the id it travels with, the routing key it is published
 * on, the payload as it goes on the wire, and how many times sending it has failed so far.
 *
 * <p>It is a read-only snapshot of the service's own entity, so the relay never needs to know the entity and never
 * writes a field it does not own.
 *
 * @param id the event's own id, also sent as the AMQP message id
 * @param routingKey the routing key the event is published on ("<kind>.<source service>")
 * @param payload the event as JSON, exactly as it goes on the wire
 * @param attempts how many times the relay tried to send it
 */
public record OutboxEventRow(String id, String routingKey, String payload, int attempts) {}
