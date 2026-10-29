package com.moonkage.identity.platform.messaging.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OutboxTest {

    private OutboxEventRepository repository;
    private Outbox outbox;

    @BeforeEach
    void setUp() {
        repository = mock(OutboxEventRepository.class);
        // same settings as Spring Boot's ObjectMapper: java.time as ISO strings
        JsonMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
        outbox = new Outbox(repository, objectMapper, new SequentialIdGenerator());
    }

    @Test
    void storesTheEventAsJsonUnderTheIdItCarries() throws Exception {
        EventId id = outbox.enqueue(
                "account.kyc_verified",
                eventId -> Map.of("eventId", eventId.toString(), "occurredAt", Instant.parse("2026-10-19T03:00:00Z")));

        ArgumentCaptor<OutboxEvent> added = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(repository).add(added.capture());
        OutboxEvent row = added.getValue();
        assertEquals(new EventId(SequentialIdGenerator.nth(1)), id);
        assertEquals(id.toString(), row.getId());
        assertEquals("account.kyc_verified", row.getRoutingKey());
        assertNull(row.getPublishedAt());
        assertEquals(0, row.getAttempts());
        assertEquals(
                JsonMapper.builder()
                        .build()
                        .readTree("{\"eventId\":\"" + id + "\",\"occurredAt\":\"2026-10-19T03:00:00Z\"}"),
                JsonMapper.builder().build().readTree(row.getPayload()));
    }

    @Test
    void anEventThatCannotBeWrittenAsJsonIsABug() {
        assertThrows(
                IllegalStateException.class, () -> outbox.enqueue("account.kyc_verified", eventId -> new Object()));
        verifyNoInteractions(repository);
    }
}
