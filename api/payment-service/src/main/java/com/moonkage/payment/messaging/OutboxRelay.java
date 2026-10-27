package com.moonkage.payment.messaging;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.entity.OutboxEvent;
import com.moonkage.payment.repository.OutboxEventRepository;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends outbox events to RabbitMQ (Software Design 6): oldest first, each one marked sent only after the broker's
 * publisher confirm. On a failure it stops and retries from that event on the next run, so order is kept. Runs in
 * one payment-service instance (two would send each event twice; consumers skip the repeat by id).
 */
@Slf4j
@Component
public class OutboxRelay {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final int batchSize;
    private final Duration confirmTimeout;

    public OutboxRelay(
            OutboxEventRepository outboxEventRepository,
            RabbitTemplate rabbitTemplate,
            @Value("${outbox.batch-size:100}") int batchSize,
            @Value("${outbox.confirm-timeout:5s}") Duration confirmTimeout) {
        this.outboxEventRepository = outboxEventRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.batchSize = batchSize;
        this.confirmTimeout = confirmTimeout;
    }

    @Scheduled(fixedDelayString = "${outbox.relay-interval:2s}")
    @Transactional
    public void relay() {
        List<OutboxEvent> batch =
                outboxEventRepository.findByPublishedAtIsNullOrderByCreatedAtAsc(PageRequest.of(0, batchSize));
        for (OutboxEvent event : batch) {
            try {
                send(event);
                event.markPublished(Instant.now());
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
            ops.waitForConfirmsOrDie(confirmTimeout.toMillis());
            return null;
        });
    }
}
