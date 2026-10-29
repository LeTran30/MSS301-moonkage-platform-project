package com.moonkage.identity.platform.messaging.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.platform.messaging.RabbitConfig;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.AmqpTimeoutException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitOperations;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

/** Q-22: an event is marked sent only after the broker confirmed it, and order is kept on failure. */
class OutboxRelayTest {

    private static final String ROUTING_KEY = "account.kyc_verified";
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    private OutboxEventRepository repository;
    private RabbitOperations ops;
    private OutboxRelay relay;

    @BeforeEach
    void setUp() {
        repository = mock(OutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        ops = mock(RabbitOperations.class);
        // run the callback against the mocked channel, like RabbitTemplate.invoke does
        when(rabbitTemplate.invoke(any()))
                .thenAnswer(inv -> inv.<RabbitOperations.OperationsCallback<?>>getArgument(0)
                        .doInRabbit(ops));
        relay = new OutboxRelay(repository, rabbitTemplate, new OutboxProperties(), Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void sendsJsonWithTheEventIdAndWaitsForTheConfirm() {
        OutboxEvent event = event(1);
        when(repository.findUnpublished(new OutboxProperties().getBatchSize())).thenReturn(List.of(event));

        relay.relay();

        ArgumentCaptor<Message> message = ArgumentCaptor.forClass(Message.class);
        verify(ops).send(eq(RabbitConfig.EVENTS_EXCHANGE), eq(ROUTING_KEY), message.capture());
        verify(ops).waitForConfirmsOrDie(5000);
        assertEquals(event.getId(), message.getValue().getMessageProperties().getMessageId());
        assertEquals(
                "application/json", message.getValue().getMessageProperties().getContentType());
        assertEquals(event.getPayload(), new String(message.getValue().getBody(), StandardCharsets.UTF_8));
        assertEquals(NOW, event.getPublishedAt());
    }

    @Test
    void stopsAtTheFirstFailureSoLaterEventsWait() {
        OutboxEvent first = event(1);
        OutboxEvent second = event(2);
        OutboxEvent third = event(3);
        when(repository.findUnpublished(new OutboxProperties().getBatchSize()))
                .thenReturn(List.of(first, second, third));
        // the first event is confirmed, the second is not
        doNothing().doThrow(new AmqpTimeoutException("no confirm")).when(ops).waitForConfirmsOrDie(5000);

        relay.relay();

        assertNotNull(first.getPublishedAt());
        assertNull(second.getPublishedAt());
        assertEquals(1, second.getAttempts());
        // the third is not even tried, so it cannot overtake the second
        assertNull(third.getPublishedAt());
        assertEquals(0, third.getAttempts());
        verify(ops, times(2)).send(any(String.class), any(String.class), any(Message.class));
    }

    private static OutboxEvent event(long n) {
        EventId id = new EventId(new UUID(0, n));
        return OutboxEvent.record(id, ROUTING_KEY, "{\"eventId\":\"" + id + "\"}");
    }
}
