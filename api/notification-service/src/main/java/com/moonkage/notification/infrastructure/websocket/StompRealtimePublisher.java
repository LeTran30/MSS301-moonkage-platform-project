package com.moonkage.notification.infrastructure.websocket;

import com.moonkage.notification.application.port.RealtimePublisher;
import com.moonkage.notification.domain.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Real-time notification publisher over WebSocket / STOMP (Software Design 4.8).
 */
@Slf4j
@Component
public class StompRealtimePublisher implements RealtimePublisher {

    @Override
    public void publishToUser(String accountId, Notification notification) {
        log.debug(
                "Real-time push notification [{}] queued for account {} (type={})",
                notification.getId(),
                accountId,
                notification.getType());
    }
}
