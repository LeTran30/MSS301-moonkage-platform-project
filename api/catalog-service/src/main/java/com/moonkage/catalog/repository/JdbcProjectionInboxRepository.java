package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcProjectionInboxRepository implements ProjectionInboxRepository {
    private final JdbcTemplate jdbc;

    @Override
    public boolean capture(String eventId, String routingKey, String payload) {
        int inserted = jdbc.update("""
                INSERT INTO projection_inbox(event_id, routing_key, payload)
                VALUES (?, ?, CAST(? AS jsonb)) ON CONFLICT DO NOTHING
                """, eventId, routingKey, payload);
        if (inserted == 0
                && !Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT routing_key=? AND payload=CAST(? AS jsonb) FROM projection_inbox WHERE event_id=?
                """, Boolean.class, routingKey, payload, eventId))) {
            throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
        }
        return inserted != 0;
    }

    @Override
    public List<InboxEntry> findPending(int limit) {
        return jdbc.query(
                """
                SELECT i.event_id, i.routing_key, i.payload::text, i.received_at FROM projection_inbox i
                WHERE NOT EXISTS(SELECT 1 FROM processed_events p WHERE p.event_id=i.event_id)
                ORDER BY i.received_at, i.event_id LIMIT ?
                """,
                (row, index) -> new InboxEntry(
                        row.getString("event_id"),
                        row.getString("routing_key"),
                        row.getString("payload"),
                        row.getTimestamp("received_at").toInstant()),
                limit);
    }
}
