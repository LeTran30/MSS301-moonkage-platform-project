package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.moonkage.identity.config.RabbitConfig;
import com.moonkage.identity.entity.OutboxEvent;
import com.moonkage.identity.messaging.NfcVerificationEvent;
import com.moonkage.identity.repository.OutboxEventRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OutboxServiceImplTest {

    @Test
    void storesTheEventAsJsonUnderItsOwnId() {
        OutboxEventRepository repository = mock(OutboxEventRepository.class);
        // same settings as Spring Boot's ObjectMapper: java.time as ISO strings
        JsonMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
        OutboxServiceImpl service = new OutboxServiceImpl(repository, objectMapper);
        NfcVerificationEvent event = NfcVerificationEvent.verified(
                "acc-1", "session-1", "********6789", Instant.parse("2026-10-19T03:00:00Z"));

        service.enqueue(event.eventId(), RabbitConfig.NFC_VERIFIED_ROUTING_KEY, event);

        ArgumentCaptor<OutboxEvent> saved = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(repository).save(saved.capture());
        OutboxEvent row = saved.getValue();
        assertEquals(event.eventId(), row.getId());
        assertEquals("account.nfc_verified", row.getRoutingKey());
        assertNull(row.getPublishedAt());
        assertTrue(row.getPayload().contains("\"accountId\":\"acc-1\""), row.getPayload());
        assertTrue(row.getPayload().contains("\"occurredAt\":\"2026-10-19T03:00:00Z\""), row.getPayload());
        // masked only (Software Design 8)
        assertTrue(row.getPayload().contains("********6789"), row.getPayload());
    }
}
