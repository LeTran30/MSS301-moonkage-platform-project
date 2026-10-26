package com.moonkage.vendor.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.common.config.RabbitConfig;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * The outbox end to end on a real PostgreSQL and RabbitMQ: an event written in a business transaction reaches the
 * {@code moonkage.events} exchange with its id as message id, and its row is marked sent only after the broker's
 * confirm. MinIO is not needed here, so ObjectStorage is a mock.
 */
@SpringBootTest
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class OutboxRelayIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Container
    @ServiceConnection
    static final RabbitMQContainer RABBITMQ = new RabbitMQContainer("rabbitmq:4.1-alpine");

    private static final String ROUTING_KEY = "vendor.updated";
    private static final long RECEIVE_TIMEOUT_MILLIS = 5_000;

    @MockitoBean
    private ObjectStorage objectStorage;

    private final OutboxService outboxService;
    private final OutboxRelay outboxRelay;
    private final OutboxEventRepository outboxEventRepository;
    private final TransactionTemplate transactionTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final AmqpAdmin amqpAdmin;
    private final TopicExchange eventsExchange;

    @Autowired
    OutboxRelayIntegrationTest(
            OutboxService outboxService,
            OutboxRelay outboxRelay,
            OutboxEventRepository outboxEventRepository,
            TransactionTemplate transactionTemplate,
            RabbitTemplate rabbitTemplate,
            AmqpAdmin amqpAdmin,
            TopicExchange eventsExchange) {
        this.outboxService = outboxService;
        this.outboxRelay = outboxRelay;
        this.outboxEventRepository = outboxEventRepository;
        this.transactionTemplate = transactionTemplate;
        this.rabbitTemplate = rabbitTemplate;
        this.amqpAdmin = amqpAdmin;
        this.eventsExchange = eventsExchange;
    }

    @Test
    void anEventWrittenInATransactionReachesTheBrokerAndIsMarkedSent() {
        Queue queue = amqpAdmin.declareQueue();
        Binding binding = BindingBuilder.bind(queue).to(eventsExchange).with(ROUTING_KEY);
        amqpAdmin.declareBinding(binding);
        String eventId = UUID.randomUUID().toString();

        transactionTemplate.executeWithoutResult(
                status -> outboxService.enqueue(eventId, ROUTING_KEY, Map.of("vendorId", "vendor-1")));
        outboxRelay.relay();

        Message message = rabbitTemplate.receive(queue.getName(), RECEIVE_TIMEOUT_MILLIS);
        assertNotNull(message, "no message on " + RabbitConfig.EVENTS_EXCHANGE + " / " + ROUTING_KEY);
        assertEquals(eventId, message.getMessageProperties().getMessageId());
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        assertTrue(body.contains("\"vendorId\":\"vendor-1\""), body);
        assertNotNull(outboxEventRepository.findById(eventId).orElseThrow().getPublishedAt());
    }
}
