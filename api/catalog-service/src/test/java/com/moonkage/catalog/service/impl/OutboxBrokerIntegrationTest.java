package com.moonkage.catalog.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.catalog.config.CatalogOutboxProperties;
import com.moonkage.catalog.entity.OutboxEvent;
import com.moonkage.catalog.repository.OutboxEventRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/** Real broker confirms and mandatory returns; independent of the project's RabbitMQ and its queues. */
@Testcontainers(disabledWithoutDocker = true)
class OutboxBrokerIntegrationTest {
    @Container
    static final GenericContainer<?> RABBIT = new GenericContainer<>(
                    DockerImageName.parse("rabbitmq:4.1-management-alpine"))
            .withEnv("RABBITMQ_DEFAULT_USER", "catalog-test")
            .withEnv("RABBITMQ_DEFAULT_PASS", "catalog-test")
            .withExposedPorts(5672)
            .waitingFor(Wait.forLogMessage(".*Server startup complete.*", 1));

    @Test
    void marksRoutedConfirmedMessageAsPublished() {
        withBroker((connection, template) -> {
            var admin = new RabbitAdmin(connection);
            var exchange = new TopicExchange("moonkage.events", true, false);
            var queue = new Queue("catalog-test-" + UUID.randomUUID(), false, false, true);
            admin.declareExchange(exchange);
            admin.declareQueue(queue);
            admin.declareBinding(BindingBuilder.bind(queue).to(exchange).with("interprovince_fee.changed"));
            var event = event("interprovince_fee.changed");
            var repository = repository(event);
            var service = new OutboxDeliveryServiceImpl(
                    repository, template, new CatalogOutboxProperties(), Clock.systemUTC());
            assertThat(service.deliverNext()).isTrue();
            verify(repository).markPublished(org.mockito.ArgumentMatchers.eq(event.id()), any(Instant.class));
            var received = template.receive(queue.getName(), 2000);
            assertThat(received).isNotNull();
            assertThat(received.getMessageProperties().getMessageId()).isEqualTo(event.id());
        });
    }

    @Test
    void retainsUnroutableMessageEvenWhenBrokerAcknowledgesExchangePublish() {
        withBroker((connection, template) -> {
            new RabbitAdmin(connection).declareExchange(new TopicExchange("moonkage.events", true, false));
            var event = event("unbound." + UUID.randomUUID());
            var repository = repository(event);
            var service = new OutboxDeliveryServiceImpl(
                    repository, template, new CatalogOutboxProperties(), Clock.systemUTC());
            assertThat(service.deliverNext()).isFalse();
            verify(repository).recordFailure(org.mockito.ArgumentMatchers.eq(event.id()), any(Instant.class));
            verify(repository, never()).markPublished(any(), any());
        });
    }

    private static OutboxEvent event(String routingKey) {
        return new OutboxEvent(UUID.randomUUID().toString(), routingKey, "{}", 0, Instant.now());
    }

    private static OutboxEventRepository repository(OutboxEvent event) {
        var repository = org.mockito.Mockito.mock(OutboxEventRepository.class);
        when(repository.lockNextUnpublished()).thenReturn(Optional.of(event));
        return repository;
    }

    private static void withBroker(java.util.function.BiConsumer<CachingConnectionFactory, RabbitTemplate> test) {
        var connection = new CachingConnectionFactory(RABBIT.getHost(), RABBIT.getMappedPort(5672));
        connection.setUsername("catalog-test");
        connection.setPassword("catalog-test");
        connection.setPublisherConfirmType(CachingConnectionFactory.ConfirmType.CORRELATED);
        connection.setPublisherReturns(true);
        try {
            var template = new RabbitTemplate(connection);
            template.setMandatory(true);
            test.accept(connection, template);
        } finally {
            connection.destroy();
        }
    }
}
