package com.moonkage.orchestrator.contract;

import java.util.Map;

/**
 * Envelope for asynchronous email notification events published via RabbitMQ.
 *
 * @param eventId UUID for idempotency / deduplication check
 * @param to recipient email address
 * @param subject email subject line
 * @param templateCode template identifier (e.g. REGISTRATION, FORGOT_PASSWORD, ORDER_CONFIRMED)
 * @param params dynamic context variables passed into Thymeleaf rendering engine
 */
public record EmailNotificationEvent(
        String eventId, String to, String subject, String templateCode, Map<String, Object> params)
        implements BaseEvent {

    @Override
    public EventType eventType() {
        return EventType.EMAIL;
    }
}
