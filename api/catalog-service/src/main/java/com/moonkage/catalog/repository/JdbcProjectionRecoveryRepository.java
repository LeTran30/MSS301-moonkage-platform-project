package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.InboxEntry;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcProjectionRecoveryRepository implements ProjectionRecoveryRepository {
    private final JdbcTemplate jdbc;

    @Override
    public List<InboxEntry> findPendingAfter(Instant receivedAt, String eventId, int limit) {
        String cursor = receivedAt == null ? "" : " AND (i.received_at, i.event_id) > (?, ?)";
        Object[] parameters =
                receivedAt == null ? new Object[] {limit} : new Object[] {Timestamp.from(receivedAt), eventId, limit};
        return jdbc.query(
                """
                SELECT i.event_id, i.routing_key, i.payload::text, i.received_at FROM projection_inbox i
                WHERE NOT EXISTS(SELECT 1 FROM processed_events p WHERE p.event_id=i.event_id)
                """ + cursor + " ORDER BY i.received_at, i.event_id LIMIT ?",
                (row, index) -> new InboxEntry(
                        row.getString("event_id"),
                        row.getString("routing_key"),
                        row.getString("payload"),
                        row.getTimestamp("received_at").toInstant()),
                parameters);
    }

    @Override
    public Optional<InboxEntry> lockEntry(String eventId) {
        return jdbc
                .query(
                        """
                SELECT event_id, routing_key, payload::text, received_at FROM projection_inbox
                WHERE event_id=? FOR UPDATE
                """,
                        (row, index) -> new InboxEntry(
                                row.getString("event_id"),
                                row.getString("routing_key"),
                                row.getString("payload"),
                                row.getTimestamp("received_at").toInstant()),
                        eventId)
                .stream()
                .findFirst();
    }

    @Override
    public Optional<String> findProcessedRoutingKey(String eventId) {
        return jdbc
                .query(
                        "SELECT routing_key FROM processed_events WHERE event_id=?",
                        (row, index) -> row.getString("routing_key"),
                        eventId)
                .stream()
                .findFirst();
    }

    @Override
    public List<String> findProductIdsAfter(String productId, int limit) {
        return productId == null
                ? jdbc.queryForList(
                        "SELECT product_id FROM product_views ORDER BY product_id LIMIT ?", String.class, limit)
                : jdbc.queryForList(
                        "SELECT product_id FROM product_views WHERE product_id>? ORDER BY product_id LIMIT ?",
                        String.class,
                        productId,
                        limit);
    }
}
