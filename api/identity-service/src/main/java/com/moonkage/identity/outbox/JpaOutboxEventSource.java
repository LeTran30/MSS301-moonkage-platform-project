package com.moonkage.identity.outbox;

import com.moonkage.outbox.OutboxEventRow;
import com.moonkage.outbox.OutboxEventSource;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * The outbox table of identity-service, as the shared relay reads and writes it.
 *
 * <p>The rows stay the service's own entity; the relay only sees the read-only {@link OutboxEventRow}.
 */
@Component
@RequiredArgsConstructor
class JpaOutboxEventSource implements OutboxEventSource {

    private final OutboxEventRepository outboxEventRepository;

    @Override
    public List<OutboxEventRow> findUnpublished(Pageable page) {
        return outboxEventRepository.findByPublishedAtIsNullOrderByCreatedAtAsc(page).stream()
                .map(event -> new OutboxEventRow(
                        event.getId(),
                        event.getRoutingKey(),
                        event.getPayload(),
                        event.getAttempts(),
                        event.getTraceParent()))
                .toList();
    }

    @Override
    public long countUnpublished() {
        return outboxEventRepository.countByPublishedAtIsNull();
    }

    @Override
    public void markPublished(String eventId, Instant publishedAt) {
        outboxEventRepository.findById(eventId).ifPresent(event -> event.markPublished(publishedAt));
    }

    @Override
    public void incrementAttempts(String eventId) {
        outboxEventRepository.findById(eventId).ifPresent(OutboxEvent::incrementAttempts);
    }
}
