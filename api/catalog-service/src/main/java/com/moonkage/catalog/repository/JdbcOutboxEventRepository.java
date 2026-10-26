package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.OutboxEvent;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcOutboxEventRepository implements OutboxEventRepository {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void save(OutboxEvent event) {
        jdbcTemplate.update(
                """
                INSERT INTO outbox_events (id, routing_key, payload, attempts, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                event.id(),
                event.routingKey(),
                event.payload(),
                event.attempts(),
                Timestamp.from(event.createdAt()),
                Timestamp.from(event.createdAt()));
    }

    @Override
    public Optional<OutboxEvent> lockNextUnpublished() {
        return jdbcTemplate
                .query(
                        """
                SELECT id, routing_key, payload, attempts, created_at FROM outbox_events
                WHERE published_at IS NULL ORDER BY created_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
                """,
                        (row, index) -> new OutboxEvent(
                                row.getString("id"),
                                row.getString("routing_key"),
                                row.getString("payload"),
                                row.getInt("attempts"),
                                row.getTimestamp("created_at").toInstant()))
                .stream()
                .findFirst();
    }

    @Override
    public void markPublished(String eventId, Instant at) {
        jdbcTemplate.update(
                "UPDATE outbox_events SET published_at = ?, updated_at = ? WHERE id = ?",
                Timestamp.from(at),
                Timestamp.from(at),
                eventId);
    }

    @Override
    public void recordFailure(String eventId, Instant at) {
        jdbcTemplate.update(
                "UPDATE outbox_events SET attempts = attempts + 1, updated_at = ? WHERE id = ?",
                Timestamp.from(at),
                eventId);
    }
}
