package com.moonkage.catalog.entity.projection;

import java.time.Instant;

/** Received raw event; absence from processed_events means no business adapter has applied it. */
public record InboxEntry(String eventId, String routingKey, String payload, Instant receivedAt) {}
