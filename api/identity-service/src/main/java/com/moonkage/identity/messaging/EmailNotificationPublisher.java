package com.moonkage.identity.messaging;

import com.moonkage.identity.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/** Publishes email notification events to the shared RabbitMQ topic exchange. */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publish(EmailNotificationEvent event) {
        rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, RabbitConfig.EMAIL_ROUTING_KEY, event);
        log.info("Published {} email event {} for {}", event.templateCode(), event.eventId(), event.to());
    }
}
