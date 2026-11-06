package com.moonkage.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.observability.OutboxMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.AmqpTimeoutException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitOperations;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Pageable;

/** Q-22: an event is marked sent only after the broker confirmed it, and the order is kept on failure. */
class OutboxRelayTest {

    private static final String EXCHANGE = "moonkage.events";
    private static final String ROUTING_KEY = "vendor.updated";

    private OutboxEventSource eventSource;
    private RabbitOperations ops;
    private OutboxRelay relay;

    @BeforeEach
    void setUp() {
        eventSource = mock(OutboxEventSource.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        ops = mock(RabbitOperations.class);
        // run the callback against the mocked channel, like RabbitTemplate.invoke does
        when(rabbitTemplate.invoke(any()))
                .thenAnswer(inv -> inv.<RabbitOperations.OperationsCallback<?>>getArgument(0)
                        .doInRabbit(ops));
        relay = new OutboxRelay(
                eventSource,
                rabbitTemplate,
                new OutboxMetrics(new SimpleMeterRegistry()),
                EXCHANGE,
                100,
                Duration.ofSeconds(5));
    }

    @Test
    void sendsJsonWithTheEventIdAndWaitsForTheConfirm() {
        when(eventSource.findUnpublished(any(Pageable.class))).thenReturn(List.of(event("e-1", 0)));

        relay.relay();

        ArgumentCaptor<Message> message = ArgumentCaptor.forClass(Message.class);
        verify(ops).send(eq(EXCHANGE), eq(ROUTING_KEY), message.capture());
        verify(ops).waitForConfirmsOrDie(5000);
        assertThat(message.getValue().getMessageProperties().getMessageId()).isEqualTo("e-1");
        assertThat(message.getValue().getMessageProperties().getContentType()).isEqualTo("application/json");
        assertThat(new String(message.getValue().getBody(), StandardCharsets.UTF_8))
                .isEqualTo("{\"eventId\":\"e-1\"}");
        verify(eventSource).markPublished(eq("e-1"), any(Instant.class));
    }

    @Test
    void stopsAtTheFirstFailureSoLaterEventsWait() {
        when(eventSource.findUnpublished(any(Pageable.class)))
                .thenReturn(List.of(event("e-1", 0), event("e-2", 0), event("e-3", 0)));
        // the first event is confirmed, the second is not
        doNothing().doThrow(new AmqpTimeoutException("no confirm")).when(ops).waitForConfirmsOrDie(5000);

        relay.relay();

        verify(eventSource).markPublished(eq("e-1"), any(Instant.class));
        verify(eventSource, times(0)).markPublished(eq("e-2"), any(Instant.class));
        // the third is not even tried, so it cannot overtake the second
        verify(eventSource, times(0)).markPublished(eq("e-3"), any(Instant.class));
        verify(eventSource).incrementAttempts("e-2");
        verify(ops, times(2)).send(any(String.class), any(String.class), any(Message.class));
    }

    @Test
    void aFailedEventCountsOneMoreAttempt() {
        when(eventSource.findUnpublished(any(Pageable.class))).thenReturn(List.of(event("e-2", 3)));
        doThrow(new AmqpTimeoutException("no confirm")).when(ops).waitForConfirmsOrDie(5000);

        relay.relay();

        verify(eventSource).incrementAttempts("e-2");
    }

    @Test
    void publishesTheNumberOfUnpublishedEventsSoAStuckRelayIsVisible() {
        when(eventSource.findUnpublished(any(Pageable.class))).thenReturn(List.of());
        when(eventSource.countUnpublished()).thenReturn(3L);

        relay.relay();

        verify(eventSource).countUnpublished();
    }

    private static OutboxEventRow event(String id, int attempts) {
        return new OutboxEventRow(id, ROUTING_KEY, "{\"eventId\":\"" + id + "\"}", attempts);
    }
}
