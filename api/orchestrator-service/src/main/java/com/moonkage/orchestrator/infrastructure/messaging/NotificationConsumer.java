package com.moonkage.orchestrator.infrastructure.messaging;

import com.moonkage.orchestrator.application.dispatcher.EventDispatcher;
import com.moonkage.orchestrator.contract.AuditEvent;
import com.moonkage.orchestrator.contract.BaseEvent;
import com.moonkage.orchestrator.contract.EmailNotificationEvent;
import com.moonkage.orchestrator.contract.InAppNotificationEvent;
import com.moonkage.orchestrator.contract.NfcVerificationEvent;
import com.moonkage.orchestrator.domain.TemplateRenderException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ consumer endpoints for email, in-app notification, and audit events.
 * Forwards incoming events to the central EventDispatcher.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EventDispatcher eventDispatcher;

    @RabbitListener(queues = RabbitConfig.EMAIL_QUEUE)
    public void onEmailEvent(EmailNotificationEvent event) {
        log.info(
                "Received EmailNotificationEvent [eventId={}]: to={}, templateCode={}",
                event != null ? event.eventId() : null,
                event != null ? event.to() : null,
                event != null ? event.templateCode() : null);
        dispatchOrRejectFatal(event);
    }

    @RabbitListener(queues = RabbitConfig.INAPP_QUEUE)
    public void onInAppEvent(InAppNotificationEvent event) {
        log.info(
                "Received InAppNotificationEvent [eventId={}]: recipient={}, type={}",
                event != null ? event.eventId() : null,
                event != null ? event.recipientAccountId() : null,
                event != null ? event.type() : null);
        dispatchOrRejectFatal(event);
    }

    @RabbitListener(queues = RabbitConfig.NFC_QUEUE)
    public void onNfcEvent(NfcVerificationEvent event) {
        log.info(
                "Received NfcVerificationEvent [eventId={}]: account={}, type={}",
                event != null ? event.eventId() : null,
                event != null ? event.accountId() : null,
                event != null ? event.type() : null);
        dispatchOrRejectFatal(event);
    }

    @RabbitListener(queues = RabbitConfig.AUDIT_QUEUE)
    public void onAuditEvent(AuditEvent event) {
        dispatchOrRejectFatal(event);
    }

    private void dispatchOrRejectFatal(BaseEvent event) {
        try {
            eventDispatcher.dispatch(event);
        } catch (TemplateRenderException | IllegalArgumentException e) {
            log.error("Fatal non-retryable notification error: {}", e.getMessage());
            throw new AmqpRejectAndDontRequeueException(e.getMessage(), e);
        }
    }
}
