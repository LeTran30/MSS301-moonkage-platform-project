package com.moonkage.vendor.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class OutboxServiceImpl implements OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Value("${spring.application.name}")
    private String sourceService;

    /** MANDATORY: an event written outside the business transaction would defeat the outbox. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(String eventId, String routingKey, Object event) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Event " + eventId + " cannot be serialized", e);
        }
        outboxEventRepository.save(OutboxEvent.builder()
                .id(eventId)
                .routingKey(routingKey)
                .payload(payload)
                .build());
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public String enqueueState(
            String routingKey, AggregateType aggregateType, String aggregateId, long sourceVersion, Object data) {
        EventEnvelope<Object> envelope = new EventEnvelope<>(
                UUID.randomUUID().toString(),
                EventEnvelope.SCHEMA_VERSION,
                routingKey,
                sourceService,
                aggregateType,
                aggregateId,
                sourceVersion,
                Instant.now(),
                data);
        enqueue(envelope.eventId(), routingKey, envelope);
        return envelope.eventId();
    }
}
