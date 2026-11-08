package com.moonkage.outbox;

/**
 * The one topic exchange every service publishes its domain events on and every service subscribes to
 * (Software Design 5.4).
 *
 * <p>The routing key of an event decides which service reads it; the exchange itself is the same everywhere, so the
 * constant lives here instead of in each service's {@code RabbitConfig}.
 */
public final class EventExchange {

    /** The name of the shared topic exchange. */
    public static final String NAME = "moonkage.events";

    private EventExchange() {
        throw new AssertionError("no instances");
    }
}
