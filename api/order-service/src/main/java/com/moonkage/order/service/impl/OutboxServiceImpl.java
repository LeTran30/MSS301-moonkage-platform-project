package com.moonkage.order.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.order.entity.OutboxEvent;
import com.moonkage.order.repository.OutboxEventRepository;
import com.moonkage.order.service.OutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OutboxServiceImpl implements OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

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
        outboxEventRepository.save(OutboxEvent.of(eventId, routingKey, payload));
    }
}
