package com.moonkage.identity.platform.messaging.outbox;

import com.moonkage.identity.platform.messaging.RabbitConfig;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends outbox events to RabbitMQ (Software Design 6): oldest first, each one marked sent only after the broker's
 * publisher confirm. On a failure it stops and retries from that event on the next run, so order is kept. Runs in
 * one identity-service instance (two would send each event twice; consumers would skip the repeat by id).
 */
@Slf4j
@Component
@RequiredArgsConstructor
class OutboxRelay {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final OutboxProperties properties;
    private final Clock clock;

    @Scheduled(fixedDelayString = "${outbox.relay-interval}")
    @Transactional
    void relay() {
        List<OutboxEvent> batch = outboxEventRepository.findUnpublished(properties.getBatchSize());
        for (OutboxEvent event : batch) {
            try {
                send(event);
                event.markPublished(Instant.now(clock));
            } catch (AmqpException e) {
                event.incrementAttempts();
                log.warn(
                        "Outbox event {} ({}) not sent, attempt {}: {}",
                        event.getId(),
                        event.getRoutingKey(),
                        event.getAttempts(),
                        e.getMessage());
                return;
            }
        }
    }

    private void send(OutboxEvent event) {
        MessageProperties props = new MessageProperties();
        props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        props.setContentEncoding(StandardCharsets.UTF_8.name());
        props.setMessageId(event.getId());
        Message message = new Message(event.getPayload().getBytes(StandardCharsets.UTF_8), props);
        rabbitTemplate.invoke(ops -> {
            ops.send(RabbitConfig.EVENTS_EXCHANGE, event.getRoutingKey(), message);
            // needs spring.rabbitmq.publisher-confirm-type: simple
            ops.waitForConfirmsOrDie(properties.getConfirmTimeout().toMillis());
            return null;
        });
    }
}
