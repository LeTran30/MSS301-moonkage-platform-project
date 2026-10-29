package com.moonkage.identity.platform.messaging.outbox;

import java.util.Objects;
import java.util.UUID;

/**
 * The id of one published event: the outbox row id, the AMQP message id and the {@code eventId} in the payload.
 * Consumers skip a repeated one. Made by {@link Outbox} through {@code IdGenerator}.
 */
public record EventId(UUID value) {

    public EventId {
        Objects.requireNonNull(value, "event id");
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
