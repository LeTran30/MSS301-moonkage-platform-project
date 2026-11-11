package com.moonkage.payment.dto.event;

import java.util.Map;

/** orchestrator.email.*: an email rendered from {@code templateCode} by orchestrator-service. */
public record EmailNotificationEvent(
        String eventId, String to, String subject, String templateCode, Map<String, Object> params) {}
