package com.moonkage.notification.channel.inapp;

import com.moonkage.notification.application.port.EventHandler;
import com.moonkage.notification.application.port.NotificationRepository;
import com.moonkage.notification.application.port.RealtimePublisher;
import com.moonkage.notification.contract.EventType;
import com.moonkage.notification.contract.InAppNotificationEvent;
import com.moonkage.notification.domain.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Channel handler dedicated to processing IN_APP notification events:
 * persists notification for user inbox and pushes real-time update via RealtimePublisher.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InAppEventHandler implements EventHandler<InAppNotificationEvent> {

    private final NotificationRepository notificationRepository;
    private final RealtimePublisher realtimePublisher;

    @Override
    public EventType supports() {
        return EventType.IN_APP;
    }

    @Override
    public void handle(InAppNotificationEvent event) {
        if (event.recipientAccountId() == null || event.recipientAccountId().isBlank()) {
            throw new IllegalArgumentException("recipientAccountId is required for IN_APP event " + event.eventId());
        }

        Notification notification = new Notification();
        notification.setRecipientAccountId(event.recipientAccountId());
        notification.setType(event.type() != null ? event.type() : "GENERAL");
        notification.setTitle(event.title() != null ? event.title() : "");
        notification.setContent(event.content() != null ? event.content() : "");
        notification.setTargetUrl(event.targetUrl());
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);
        realtimePublisher.publishToUser(saved.getRecipientAccountId(), saved);
        log.info("In-app channel processed event [{}] for account {}", event.eventId(), event.recipientAccountId());
    }
}
