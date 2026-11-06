package com.moonkage.orchestrator.channel.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.orchestrator.application.port.RealtimeDestination;
import com.moonkage.orchestrator.application.port.RealtimePublisher;
import com.moonkage.orchestrator.contract.ChatEvent;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Pushes an order chat event to the open pages of its recipients. Nothing is stored and nothing is retried: the web
 * reads the thread from order-service, the push only saves it a poll.
 */
@Component
@RequiredArgsConstructor
public class ChatRealtimeRelay {

    private final RealtimePublisher realtimePublisher;

    public void relay(ChatEvent event) {
        if (event == null || event.orderId() == null || event.type() == null || event.recipients() == null) {
            throw new IllegalArgumentException("orderId, type and recipients are required for a chat event");
        }
        ChatPush push = ChatPush.from(event);
        event.recipients().stream()
                .filter(accountId -> accountId != null && !accountId.isBlank())
                .distinct()
                .forEach(accountId -> realtimePublisher.publishToUser(accountId, RealtimeDestination.CHAT, push));
    }

    /** What the web receives on {@code /user/queue/chat}: the event without its recipient list. */
    public record ChatPush(
            String type,
            String orderId,
            String senderAccountId,
            String senderParty,
            JsonNode message,
            Long readUpToSeq,
            Instant occurredAt) {

        static ChatPush from(ChatEvent event) {
            return new ChatPush(
                    event.type(),
                    event.orderId(),
                    event.senderAccountId(),
                    event.senderParty(),
                    event.message(),
                    event.readUpToSeq(),
                    event.occurredAt());
        }
    }
}
