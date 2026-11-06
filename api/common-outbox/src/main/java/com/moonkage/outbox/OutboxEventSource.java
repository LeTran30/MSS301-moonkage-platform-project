package com.moonkage.outbox;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;

/**
 * The outbox table of one service, as the relay reads and writes it.
 *
 * <p>A service implements this on its own repository, so the relay stays the same in every service while the table
 * stays the service's own. The relay only knows the four operations below, so it never touches a JPA entity and
 * never guesses a column name.
 */
public interface OutboxEventSource {

    /**
     * The events that are not published yet, oldest first, so the events of one aggregate reach the consumers in the
     * order they happened.
     */
    List<OutboxEventRow> findUnpublished(Pageable page);

    /** How many events are written but not published yet: the sign that the relay is stuck (BE-11b). */
    long countUnpublished();

    /** Marks the event as published; the broker confirmed it. */
    void markPublished(String eventId, Instant publishedAt);

    /** Records one more failed attempt. */
    void incrementAttempts(String eventId);
}
