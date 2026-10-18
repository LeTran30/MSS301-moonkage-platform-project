package com.moonkage.identity.messaging;

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

import com.moonkage.identity.config.OutboxProperties;
import com.moonkage.identity.config.RabbitConfig;
import com.moonkage.identity.entity.OutboxEvent;
import com.moonkage.identity.repository.OutboxEventRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.AmqpTimeoutException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitOperations;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Pageable;

/** Q-22: an event is marked sent only after the broker confirmed it, and order is kept on failure. */
class OutboxRelayTest {

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
        relay = new OutboxRelay(repository, rabbitTemplate, new OutboxProperties());
    }

    @Test
    void sendsJsonWithTheEventIdAndWaitsForTheConfirm() {
        OutboxEvent event = event("e-1");
        when(repository.findByPublishedAtIsNullOrderByCreatedAtAsc(any(Pageable.class)))
                .thenReturn(List.of(event));

        relay.relay();

        ArgumentCaptor<Message> message = ArgumentCaptor.forClass(Message.class);
        verify(ops)
                .send(eq(RabbitConfig.EVENTS_EXCHANGE), eq(RabbitConfig.NFC_VERIFIED_ROUTING_KEY), message.capture());
        verify(ops).waitForConfirmsOrDie(5000);
        assertEquals("e-1", message.getValue().getMessageProperties().getMessageId());
        assertEquals(
                "application/json", message.getValue().getMessageProperties().getContentType());
        assertEquals("{\"eventId\":\"e-1\"}", new String(message.getValue().getBody(), StandardCharsets.UTF_8));
        assertNotNull(event.getPublishedAt());
    }

    @Test
    void stopsAtTheFirstFailureSoLaterEventsWait() {
        OutboxEvent first = event("e-1");
        OutboxEvent second = event("e-2");
        OutboxEvent third = event("e-3");
        when(repository.findByPublishedAtIsNullOrderByCreatedAtAsc(any(Pageable.class)))
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

    private static OutboxEvent event(String id) {
        return OutboxEvent.builder()
                .id(id)
                .routingKey(RabbitConfig.NFC_VERIFIED_ROUTING_KEY)
                .payload("{\"eventId\":\"" + id + "\"}")
                .build();
    }
}
