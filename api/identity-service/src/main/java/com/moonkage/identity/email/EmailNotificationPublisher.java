package com.moonkage.identity.email;

import com.moonkage.identity.common.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/** Publishes email notification events to the shared RabbitMQ topic exchange. */
@Slf4j
@Component
@RequiredArgsConstructor
class EmailNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    void publish(EmailNotificationEvent event) {
        rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, RabbitConfig.EMAIL_ROUTING_KEY, event);
        log.info("Published {} email event {} for {}", event.templateCode(), event.eventId(), event.to());
    }
}
