package com.moonkage.catalog.messaging;

import com.moonkage.catalog.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends audit events to RabbitMQ only after the business transaction commits, so a rolled-back change is
 * never logged. shortcut: an event is lost if the broker is down at that moment; the outbox table planned in
 * Software Design 5.4 closes that gap.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditPublisher {

    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(AuditEvent event) {
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, RabbitConfig.AUDIT_ROUTING_KEY, event);
        } catch (AmqpException e) {
            log.error(
                    "Audit event lost ({} on {} {}): {}",
                    event.action(),
                    event.targetType(),
                    event.targetId(),
                    e.getMessage());
        }
    }
}
