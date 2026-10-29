package com.moonkage.identity.platform.messaging.outbox;

import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * The {@code outbox_events} table. The id is set before saving, so a new row goes through {@code persist}: Spring
 * Data's {@code save} would treat it as existing and {@code merge} it (plan v2, 5.5.5).
 */
@Repository
@RequiredArgsConstructor
class OutboxEventRepository {

    private final EntityManager entityManager;

    void add(OutboxEvent event) {
        entityManager.persist(event);
    }

    /** Oldest first, so events of one account reach consumers in the order they happened. */
    List<OutboxEvent> findUnpublished(int limit) {
        return entityManager
                .createQuery(
                        "SELECT e FROM OutboxEvent e WHERE e.publishedAt IS NULL ORDER BY e.createdAt ASC",
                        OutboxEvent.class)
                .setMaxResults(limit)
                .getResultList();
    }
}
