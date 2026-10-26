package com.moonkage.quotation.service;

/** Writes an event into outbox_events inside the caller's transaction (NFR-05). */
public interface OutboxService {

    void enqueue(String eventId, String routingKey, Object event);
}
