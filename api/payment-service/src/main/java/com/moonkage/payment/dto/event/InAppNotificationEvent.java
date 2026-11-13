package com.moonkage.payment.dto.event;

/** orchestrator.inapp.*: a notification in the buyer's inbox, as orchestrator-service reads it. */
public record InAppNotificationEvent(
        String eventId, String recipientAccountId, String type, String title, String content, String targetUrl) {}
