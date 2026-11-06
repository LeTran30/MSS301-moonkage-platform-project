package com.moonkage.orchestrator.infrastructure.messaging;

import com.moonkage.orchestrator.channel.chat.ChatRealtimeRelay;
import com.moonkage.orchestrator.contract.ChatEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/** order-service chat.*: straight to the relay, without the dispatcher's event log (a push is not a notification). */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatConsumer {

    private final ChatRealtimeRelay chatRealtimeRelay;

    @RabbitListener(queues = RabbitConfig.CHAT_QUEUE)
    public void onChatEvent(ChatEvent event) {
        try {
            chatRealtimeRelay.relay(event);
        } catch (IllegalArgumentException e) {
            log.warn("Chat event dropped: {}", e.getMessage());
            throw new AmqpRejectAndDontRequeueException(e.getMessage(), e);
        }
    }
}
