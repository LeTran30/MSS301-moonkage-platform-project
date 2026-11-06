package com.moonkage.order.dto.event;

import com.moonkage.order.dto.response.ChatMessageResponse;
import java.time.Instant;
import java.util.List;

/**
 * chat.message_sent, chat.read and chat.typing: what orchestrator pushes to the open pages of {@code recipients}
 * (STOMP /user/queue/chat). A hint only: the thread itself is always read from order-service.
 *
 * @param type MESSAGE, READ or TYPING
 * @param message the new message (MESSAGE only)
 * @param readUpToSeq how far the sender has read (READ only)
 */
public record ChatEvent(
        String eventId,
        String type,
        String orderId,
        List<String> recipients,
        String senderAccountId,
        String senderParty,
        ChatMessageResponse message,
        Long readUpToSeq,
        Instant occurredAt) {}
