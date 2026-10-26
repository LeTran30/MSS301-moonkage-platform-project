package com.moonkage.catalog.entity;

import java.time.Instant;

public record OutboxEvent(String id, String routingKey, String payload, int attempts, Instant createdAt) {}
