package com.moonkage.order.service;

/** Skips events already handled: RabbitMQ delivers at least once (NFR-05, integration.md). */
public interface InboxService {

    /**
     * Marks the event handled, in the caller's transaction so the mark and the handling commit together. Two
     * deliveries racing: the second fails on the primary key, rolls back, and is skipped when redelivered.
     *
     * @return false when the event was handled before; the caller then does nothing
     */
    boolean markProcessed(String eventId, String routingKey);
}
