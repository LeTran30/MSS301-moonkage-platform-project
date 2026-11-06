package com.moonkage.identity.email;

import com.moonkage.identity.common.config.RabbitConfig;
import com.moonkage.observability.PiiMasker;
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
        // the recipient is masked: the log names the event, not the person (NFR-03)
        log.info(
                "Published {} email event {} for {}",
                event.templateCode(),
                event.eventId(),
                PiiMasker.maskEmail(event.to()));
    }
}
