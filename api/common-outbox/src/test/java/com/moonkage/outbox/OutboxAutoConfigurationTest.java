package com.moonkage.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.observability.OutboxMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Pageable;

/**
 * The auto-configuration supplies the relay to every service that has an outbox table, with the settings of
 * {@code outbox.*} in application.yml.
 */
class OutboxAutoConfigurationTest {

    private OutboxAutoConfiguration configuration;

    @BeforeEach
    void setUp() {
        configuration = new OutboxAutoConfiguration();
    }

    @Test
    void buildsTheRelayFromTheServiceSourceAndTheSharedProperties() {
        OutboxProperties properties = new OutboxProperties();
        properties.setBatchSize(7);
        properties.setConfirmTimeout(Duration.ofSeconds(3));

        OutboxRelay relay = configuration.outboxRelay(
                mock(OutboxEventSource.class),
                mock(RabbitTemplate.class),
                new OutboxMetrics(new SimpleMeterRegistry()),
                properties);

        assertThat(relay).isNotNull();
    }

    @Test
    void theDefaultExchangeIsTheOneEveryServicePublishesOn() {
        assertThat(new OutboxProperties().getExchange()).isEqualTo(EventExchange.NAME);
        assertThat(EventExchange.NAME).isEqualTo("moonkage.events");
    }

    @Test
    void theExchangeCanBeSetPerDeployment() {
        OutboxProperties properties = new OutboxProperties();
        properties.setExchange("other.exchange");

        assertThat(properties.getExchange()).isEqualTo("other.exchange");
    }

    @Test
    void theSourceIsReadOnePageAtATime() {
        OutboxEventSource source = mock(OutboxEventSource.class);
        when(source.findUnpublished(any(Pageable.class)))
                .thenReturn(List.of(new OutboxEventRow("e-1", "vendor.updated", "{}", 0)));

        assertThat(source.findUnpublished(Pageable.unpaged())).hasSize(1);
    }
}
