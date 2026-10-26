package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.config.CatalogOutboxProperties;
import com.moonkage.catalog.config.RabbitConfig;
import com.moonkage.catalog.entity.OutboxEvent;
import com.moonkage.catalog.repository.OutboxEventRepository;
import com.moonkage.catalog.service.OutboxDeliveryService;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxDeliveryServiceImpl implements OutboxDeliveryService {
    private final OutboxEventRepository outboxRepository;
    private final RabbitTemplate rabbitTemplate;
    private final CatalogOutboxProperties properties;
    private final Clock clock;

    @Override
    @Transactional
    public boolean deliverNext() {
        Optional<OutboxEvent> candidate = outboxRepository.lockNextUnpublished();
        if (candidate.isEmpty()) {
            return false;
        }
        OutboxEvent event = candidate.get();
        if (!send(event)) {
            outboxRepository.recordFailure(event.id(), clock.instant());
            return false;
        }
        outboxRepository.markPublished(event.id(), clock.instant());
        return true;
    }

    private boolean send(OutboxEvent event) {
        MessageProperties messageProperties = new MessageProperties();
        messageProperties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        messageProperties.setContentEncoding(StandardCharsets.UTF_8.name());
        messageProperties.setMessageId(event.id());
        messageProperties.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
        Message message = new Message(event.payload().getBytes(StandardCharsets.UTF_8), messageProperties);
        CorrelationData correlation = new CorrelationData(event.id());
        try {
            rabbitTemplate.send(RabbitConfig.EVENTS_EXCHANGE, event.routingKey(), message, correlation);
            CorrelationData.Confirm confirm =
                    correlation.getFuture().get(properties.getConfirmTimeout().toMillis(), TimeUnit.MILLISECONDS);
            // Rabbit can ACK an unroutable message. Returns are populated before the confirm future completes.
            if (confirm.isAck() && correlation.getReturned() == null) {
                return true;
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        } catch (AmqpException | ExecutionException | TimeoutException exception) {
            log.warn(
                    "Outbox event {} ({}) remains pending: {}",
                    event.id(),
                    event.routingKey(),
                    exception.getClass().getSimpleName());
        }
        return false;
    }
}
