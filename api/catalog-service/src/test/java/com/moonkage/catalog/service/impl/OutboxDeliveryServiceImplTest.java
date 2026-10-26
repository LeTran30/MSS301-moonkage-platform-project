package com.moonkage.catalog.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.catalog.config.CatalogOutboxProperties;
import com.moonkage.catalog.entity.OutboxEvent;
import com.moonkage.catalog.repository.OutboxEventRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@ExtendWith(MockitoExtension.class)
class OutboxDeliveryServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-26T07:00:00Z");
    private static final OutboxEvent EVENT = new OutboxEvent("event-1", "interprovince_fee.changed", "{}", 0, NOW);

    @Mock
    private OutboxEventRepository repository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private OutboxDeliveryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OutboxDeliveryServiceImpl(
                repository, rabbitTemplate, new CatalogOutboxProperties(), Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void publishesPersistentMessageWithEventIdOnlyAfterRoutedAck() {
        mockConfirm(true, false);
        assertThat(service.deliverNext()).isTrue();
        verify(repository).markPublished(EVENT.id(), NOW);
        verify(repository, never()).recordFailure(any(), any());
    }

    @Test
    void keepsUnroutableAckPending() {
        mockConfirm(true, true);
        assertThat(service.deliverNext()).isFalse();
        verify(repository).recordFailure(EVENT.id(), NOW);
        verify(repository, never()).markPublished(any(), any());
    }

    @Test
    void keepsNackPending() {
        mockConfirm(false, false);
        assertThat(service.deliverNext()).isFalse();
        verify(repository).recordFailure(EVENT.id(), NOW);
        verify(repository, never()).markPublished(any(), any());
    }

    @Test
    void keepsBrokerFailurePending() {
        when(repository.lockNextUnpublished()).thenReturn(Optional.of(EVENT));
        doAnswer(invocation -> {
                    throw new AmqpException("broker down");
                })
                .when(rabbitTemplate)
                .send(eq("moonkage.events"), eq(EVENT.routingKey()), any(Message.class), any(CorrelationData.class));
        assertThat(service.deliverNext()).isFalse();
        verify(repository).recordFailure(EVENT.id(), NOW);
        verify(repository, never()).markPublished(any(), any());
    }

    @Test
    void stopsWhenQueueIsEmpty() {
        when(repository.lockNextUnpublished()).thenReturn(Optional.empty());
        assertThat(service.deliverNext()).isFalse();
        verify(rabbitTemplate, never())
                .send(any(String.class), any(String.class), any(Message.class), any(CorrelationData.class));
    }

    @Test
    void timeoutKeepsMessagePendingWithoutWaitingForRealTime() {
        when(repository.lockNextUnpublished()).thenReturn(Optional.of(EVENT));
        var properties = org.mockito.Mockito.mock(CatalogOutboxProperties.class);
        when(properties.getConfirmTimeout()).thenReturn(java.time.Duration.ZERO);
        service =
                new OutboxDeliveryServiceImpl(repository, rabbitTemplate, properties, Clock.fixed(NOW, ZoneOffset.UTC));
        assertThat(service.deliverNext()).isFalse();
        verify(repository).recordFailure(EVENT.id(), NOW);
        verify(repository, never()).markPublished(any(), any());
    }

    private void mockConfirm(boolean ack, boolean returned) {
        when(repository.lockNextUnpublished()).thenReturn(Optional.of(EVENT));
        doAnswer(invocation -> {
                    Message message = invocation.getArgument(2);
                    CorrelationData correlation = invocation.getArgument(3);
                    assertThat(message.getMessageProperties().getMessageId()).isEqualTo(EVENT.id());
                    assertThat(message.getMessageProperties().getDeliveryMode())
                            .isEqualTo(MessageDeliveryMode.PERSISTENT);
                    if (returned) {
                        correlation.setReturned(
                                new ReturnedMessage(message, 312, "NO_ROUTE", "moonkage.events", EVENT.routingKey()));
                    }
                    correlation.getFuture().complete(new CorrelationData.Confirm(ack, ack ? null : "nack"));
                    return null;
                })
                .when(rabbitTemplate)
                .send(eq("moonkage.events"), eq(EVENT.routingKey()), any(Message.class), any(CorrelationData.class));
    }
}
