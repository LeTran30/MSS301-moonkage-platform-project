package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.OutboxEvent;
import java.time.Instant;
import java.util.Optional;

public interface OutboxEventRepository {
    void save(OutboxEvent event);

    Optional<OutboxEvent> lockNextUnpublished();

    void markPublished(String eventId, Instant at);

    void recordFailure(String eventId, Instant at);
}
