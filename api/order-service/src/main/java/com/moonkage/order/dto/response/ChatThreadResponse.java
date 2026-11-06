package com.moonkage.order.dto.response;

import java.util.List;

/**
 * A page of a conversation, oldest first, as the caller sees it.
 *
 * @param myParty BUYER or VENDOR
 * @param buyerReadSeq how far the buyer has read (0: nothing)
 * @param vendorReadSeq how far the Shop owner has read
 * @param hasMore whether older messages exist before the first one here
 */
public record ChatThreadResponse(
        String conversationId,
        String myParty,
        List<ChatMessageResponse> messages,
        long buyerReadSeq,
        long vendorReadSeq,
        boolean hasMore) {}
