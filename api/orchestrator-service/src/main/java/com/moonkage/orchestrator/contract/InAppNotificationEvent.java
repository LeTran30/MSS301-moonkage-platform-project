package com.moonkage.orchestrator.contract;

/**
 * Envelope for asynchronous in-app notification events published via RabbitMQ.
 *
 * @param eventId UUID for idempotency check
 * @param recipientAccountId target user account ID
 * @param type notification category (e.g. ORDER_STATUS, QUOTE_RECEIVED, VENDOR_REVIEWED)
 * @param title notification title
 * @param content notification body
 * @param targetUrl client deep-link path
 */
public record InAppNotificationEvent(
        String eventId, String recipientAccountId, String type, String title, String content, String targetUrl)
        implements BaseEvent {

    @Override
    public EventType eventType() {
        return EventType.IN_APP;
    }
}
