package com.moonkage.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.ReviewCreatedEvent;
import com.moonkage.order.entity.OutboxEvent;
import com.moonkage.order.enums.AggregateType;
import com.moonkage.order.messaging.outbox.OutboxServiceImpl;
import com.moonkage.order.repository.outbox.OutboxEventRepository;
import com.moonkage.outbox.OutboxTraceContext;
import io.micrometer.tracing.Tracer;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class OutboxServiceImplTest {

    private final OutboxEventRepository repository = mock(OutboxEventRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    private final OutboxServiceImpl outbox =
            new OutboxServiceImpl(repository, objectMapper, new OutboxTraceContext(Tracer.NOOP));

    @Test
    void reviewCreatedGoesOutInTheV1EnvelopeCatalogReads() throws Exception {
        ReflectionTestUtils.setField(outbox, "sourceService", "order-service");
        var review = new ReviewCreatedEvent(
                "review-1", "product-1", "vendor-1", "order-1", 5, null, Instant.parse("2026-11-02T07:00:00Z"));

        String eventId = outbox.enqueueState(
                RabbitConfig.REVIEW_CREATED_ROUTING_KEY,
                AggregateType.REVIEW,
                review.reviewId(),
                ReviewCreatedEvent.SOURCE_VERSION,
                review);

        var saved = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(eventId);
        assertThat(saved.getValue().getRoutingKey()).isEqualTo("review.created");
        JsonNode wire = objectMapper.readTree(saved.getValue().getPayload());
        assertThat(wire.get("eventId").asText()).isEqualTo(eventId);
        assertThat(wire.get("schemaVersion").asInt()).isEqualTo(1);
        assertThat(wire.get("eventType").asText()).isEqualTo("review.created");
        assertThat(wire.get("sourceService").asText()).isEqualTo("order-service");
        assertThat(wire.get("aggregateType").asText()).isEqualTo("REVIEW");
        assertThat(wire.get("aggregateId").asText()).isEqualTo("review-1");
        assertThat(wire.get("sourceVersion").asLong()).isEqualTo(1);
        assertThat(wire.get("occurredAt").isTextual()).isTrue();
        JsonNode data = wire.get("data");
        assertThat(data.get("reviewId").asText()).isEqualTo("review-1");
        assertThat(data.get("rating").asInt()).isEqualTo(5);
        assertThat(data.has("content")).isTrue();
        assertThat(data.get("content").isNull()).isTrue();
        assertThat(data.get("createdAt").asText()).isEqualTo("2026-11-02T07:00:00Z");
    }
}
