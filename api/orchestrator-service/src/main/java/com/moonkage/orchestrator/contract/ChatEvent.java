package com.moonkage.orchestrator.contract;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;

/**
 * order-service chat.message_sent, chat.read, chat.typing: who to push to and what. Mirror of order-service
 * {@code ChatEvent}; {@code message} is passed through untouched, so its fields can grow on one side only.
 *
 * @param type MESSAGE, READ or TYPING
 * @param recipients the accounts whose open pages get the push
 */
public record ChatEvent(
        String eventId,
        String type,
        String orderId,
        List<String> recipients,
        String senderAccountId,
        String senderParty,
        JsonNode message,
        Long readUpToSeq,
        Instant occurredAt) {}
