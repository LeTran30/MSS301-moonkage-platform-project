package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.OutboxEvent;
import java.time.Instant;
import java.util.Optional;

public interface OutboxEventRepository {
    void save(OutboxEvent event);

    Optional<OutboxEvent> lockNextUnpublished();

    void markPublished(String eventId, Instant at);

    void recordFailure(String eventId, Instant at);

    /** How many events are written but not published yet: the sign that the relay is stuck (BE-11b). */
    long countUnpublished();
}
