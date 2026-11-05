package com.moonkage.vendor.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

/**
 * The adapter between the service's own outbox rows and the shared relay: it must publish the same values the
 * relay sends and write the same state back.
 */
class JpaOutboxEventSourceTest {

    private OutboxEventRepository repository;
    private JpaOutboxEventSource source;

    @BeforeEach
    void setUp() {
        repository = mock(OutboxEventRepository.class);
        source = new JpaOutboxEventSource(repository);
    }

    @Test
    void unpublishedEventsArePublishedAsReadOnlyRows() {
        when(repository.findByPublishedAtIsNullOrderByCreatedAtAsc(any(Pageable.class)))
                .thenReturn(List.of(event("e-1")));

        List<com.moonkage.outbox.OutboxEventRow> rows = source.findUnpublished(Pageable.unpaged());

        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().id()).isEqualTo("e-1");
        assertThat(rows.getFirst().routingKey()).isEqualTo("vendor.updated");
        assertThat(rows.getFirst().payload()).isEqualTo("{\"vendorId\":\"vendor-1\"}");
        assertThat(rows.getFirst().attempts()).isZero();
    }

    @Test
    void theNumberOfUnpublishedEventsIsTheRelayGauge() {
        when(repository.countByPublishedAtIsNull()).thenReturn(4L);

        assertThat(source.countUnpublished()).isEqualTo(4L);
    }

    @Test
    void markingAnEventPublishedWritesTheTimestampOnTheRow() {
        OutboxEvent event = event("e-1");
        when(repository.findById("e-1")).thenReturn(Optional.of(event));
        Instant publishedAt = Instant.parse("2026-11-05T00:00:00Z");

        source.markPublished("e-1", publishedAt);

        assertThat(event.getPublishedAt()).isEqualTo(publishedAt);
    }

    @Test
    void aFailedAttemptIsCountedOnTheRow() {
        OutboxEvent event = event("e-1");
        when(repository.findById("e-1")).thenReturn(Optional.of(event));

        source.incrementAttempts("e-1");

        assertThat(event.getAttempts()).isEqualTo(1);
    }

    @Test
    void anEventThatIsGoneIsNotAnError() {
        when(repository.findById("e-1")).thenReturn(Optional.empty());

        source.markPublished("e-1", Instant.now());
        source.incrementAttempts("e-1");

        verify(repository, times(2)).findById("e-1");
    }

    private static OutboxEvent event(String id) {
        return OutboxEvent.builder()
                .id(id)
                .routingKey("vendor.updated")
                .payload("{\"vendorId\":\"vendor-1\"}")
                .build();
    }
}
