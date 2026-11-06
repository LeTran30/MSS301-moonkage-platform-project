package com.moonkage.order.dto.response;

import java.util.List;

/**
 * A page of an order's chat, oldest first, as the caller sees it.
 *
 * @param myParty BUYER or VENDOR; null for an admin, who only reads
 * @param buyerReadSeq how far the buyer has read (0: nothing)
 * @param vendorReadSeq how far the vendor owner has read
 * @param hasMore whether older messages exist before the first one here
 */
public record ChatThreadResponse(
        String orderId,
        String myParty,
        List<ChatMessageResponse> messages,
        long buyerReadSeq,
        long vendorReadSeq,
        boolean hasMore) {}
