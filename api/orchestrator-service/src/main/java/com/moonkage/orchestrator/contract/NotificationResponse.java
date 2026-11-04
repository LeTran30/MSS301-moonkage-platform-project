package com.moonkage.orchestrator.contract;

import java.time.Instant;

/**
 * One notification of the caller's inbox (NFR-10, AC-10.2).
 *
 * @param id the notification id
 * @param type the category the event carried (ORDER_STATUS, QUOTE_RECEIVED, ...)
 * @param title the headline
 * @param content the body
 * @param targetUrl the deep link the web opens when the notification is clicked; may be null
 * @param read whether the caller has already read it
 * @param createdAt when the notification was stored
 */
public record NotificationResponse(
        String id, String type, String title, String content, String targetUrl, boolean read, Instant createdAt) {}
