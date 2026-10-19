package com.moonkage.orchestrator.infrastructure.websocket;

import com.moonkage.orchestrator.application.port.RealtimeDestination;
import com.moonkage.orchestrator.application.port.RealtimePublisher;
import com.moonkage.orchestrator.domain.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Real-time push over WebSocket / STOMP (Software Design 4.8). The STOMP user is the account id set on CONNECT
 * ({@link StompAuthInterceptor}), so {@code convertAndSendToUser} reaches every open page of that account.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompRealtimePublisher implements RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publishToUser(String accountId, Notification notification) {
        publishToUser(accountId, RealtimeDestination.NOTIFICATIONS, notification);
    }

    @Override
    public void publishToUser(String accountId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(accountId, destination, payload);
        log.debug("Pushed to {} of account {}", destination, accountId);
    }
}
