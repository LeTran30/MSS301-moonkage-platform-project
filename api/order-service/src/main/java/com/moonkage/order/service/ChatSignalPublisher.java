package com.moonkage.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.outbound.ChatEvent;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Sends chat.* straight to RabbitMQ once the change commits, not through the outbox: a push is only a hint for an
 * open page, and the outbox's polling delay would make the chat feel slow. A lost push costs nothing; the page reads
 * the thread again when it reconnects.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatSignalPublisher {

    /** A typing or read hint older than this is useless; RabbitMQ drops it. */
    static final String HINT_EXPIRATION_MS = "30000";

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishAfterCommit(String routingKey, ChatEvent event) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish(routingKey, event);
                }
            });
        } else {
            publish(routingKey, event);
        }
    }

    private void publish(String routingKey, ChatEvent event) {
        try {
            MessageProperties props = new MessageProperties();
            props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
            props.setContentEncoding(StandardCharsets.UTF_8.name());
            props.setMessageId(event.eventId());
            props.setExpiration(HINT_EXPIRATION_MS);
            byte[] body = objectMapper.writeValueAsBytes(event);
            rabbitTemplate.send(RabbitConfig.EVENTS_EXCHANGE, routingKey, new Message(body, props));
        } catch (JsonProcessingException | AmqpException e) {
            log.warn("Chat {} of conversation {} not pushed: {}", event.type(), event.conversationId(), e.getMessage());
        }
    }
}
