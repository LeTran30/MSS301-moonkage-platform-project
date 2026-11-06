package com.moonkage.order.dto.response;

import java.time.Instant;

/**
 * One line of an inbox: who is on the other side and what was said last.
 *
 * @param myParty BUYER or VENDOR, from the caller's side
 * @param lastMessage null while nothing was sent yet
 * @param unreadCount messages from the other side the caller has not read
 */
public record ConversationResponse(
        String id,
        String vendorId,
        String vendorName,
        String buyerAccountId,
        String buyerName,
        String myParty,
        ChatMessageResponse lastMessage,
        Instant lastMessageAt,
        long unreadCount) {}
