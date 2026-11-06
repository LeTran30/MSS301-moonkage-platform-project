package com.moonkage.order.dto.response;

import java.time.Instant;

/**
 * One chat message as both sides see it.
 *
 * @param attachmentUrl a short-lived link to the file; ask for the thread again once it expires
 */
public record ChatMessageResponse(
        String id,
        long seq,
        String orderId,
        String senderAccountId,
        String senderParty,
        String body,
        String attachmentName,
        String attachmentContentType,
        String attachmentUrl,
        Instant createdAt) {}
