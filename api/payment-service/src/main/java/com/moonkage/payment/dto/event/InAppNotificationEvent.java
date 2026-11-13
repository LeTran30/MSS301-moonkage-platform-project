package com.moonkage.payment.dto.event;

/** Wire-compatible with orchestrator-service's in-app notification contract. */
public record InAppNotificationEvent(
        String eventId, String recipientAccountId, String type, String title, String content, String targetUrl) {}
