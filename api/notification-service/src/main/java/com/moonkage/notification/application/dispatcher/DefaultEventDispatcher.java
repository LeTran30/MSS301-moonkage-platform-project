package com.moonkage.notification.application.dispatcher;

import com.moonkage.notification.application.port.EventHandler;
import com.moonkage.notification.application.port.NotificationEventLogRepository;
import com.moonkage.notification.contract.BaseEvent;
import com.moonkage.notification.contract.EmailNotificationEvent;
import com.moonkage.notification.contract.EventType;
import com.moonkage.notification.contract.InAppNotificationEvent;
import com.moonkage.notification.domain.DeliveryStatus;
import com.moonkage.notification.domain.NotificationEventLog;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Central event dispatcher responsible for idempotency checks, status tracking,
 * and routing incoming events to their corresponding channel handlers.
 */
@Slf4j
@Service
public class DefaultEventDispatcher implements EventDispatcher {

    private final NotificationEventLogRepository eventLogRepository;
    private final Map<EventType, EventHandler<? extends BaseEvent>> handlers;

    public DefaultEventDispatcher(
            NotificationEventLogRepository eventLogRepository, List<EventHandler<? extends BaseEvent>> handlerBeans) {
        this.eventLogRepository = eventLogRepository;
        Map<EventType, EventHandler<? extends BaseEvent>> map = new EnumMap<>(EventType.class);
        for (EventHandler<? extends BaseEvent> handler : handlerBeans) {
            map.put(handler.supports(), handler);
        }
        this.handlers = Map.copyOf(map);
    }

    @Override
    @Transactional
    public void dispatch(BaseEvent event) {
        if (event == null || event.eventType() == null) {
            throw new IllegalArgumentException("Event payload or eventType is null");
        }

        EventHandler<? extends BaseEvent> handler = handlers.get(event.eventType());
        if (handler == null) {
            throw new IllegalStateException("No EventHandler registered for EventType: " + event.eventType());
        }

        NotificationEventLog eventLog = null;
        String eventId = event.eventId();

        // Idempotency guard for events carrying a deduplication eventId
        if (eventId != null && !eventId.isBlank()) {
            Optional<NotificationEventLog> existingOpt = eventLogRepository.findById(eventId);
            if (existingOpt.isPresent()) {
                NotificationEventLog existing = existingOpt.get();
                if (existing.getStatus() == DeliveryStatus.SENT) {
                    log.info(
                            "[Idempotency] Event {} (type={}) already processed and sent. Skipping duplicate.",
                            eventId,
                            event.eventType());
                    return;
                }
                eventLog = existing;
            } else {
                eventLog = eventLogRepository.save(initEventLog(event));
            }
        }

        try {
            invokeHandler(handler, event);
            if (eventLog != null) {
                eventLog.setStatus(DeliveryStatus.SENT);
                eventLog.setSentAt(Instant.now());
                eventLog.setErrorMessage(null);
                eventLogRepository.save(eventLog);
            }
        } catch (RuntimeException e) {
            if (eventLog != null) {
                eventLog.setStatus(DeliveryStatus.FAILED);
                eventLog.setErrorMessage(e.getMessage());
                eventLogRepository.save(eventLog);
            }
            throw e;
        }
    }

    @SuppressWarnings("unchecked") // Safe: handler is matched by event.eventType()
    private static <E extends BaseEvent> void invokeHandler(EventHandler<E> handler, BaseEvent event) {
        handler.handle((E) event);
    }

    private static NotificationEventLog initEventLog(BaseEvent event) {
        NotificationEventLog logEntry = new NotificationEventLog();
        logEntry.setEventId(event.eventId());
        logEntry.setStatus(DeliveryStatus.PENDING);

        if (event instanceof EmailNotificationEvent emailEvent) {
            logEntry.setRecipient(emailEvent.to() != null ? emailEvent.to() : "");
            logEntry.setSubject(emailEvent.subject() != null ? emailEvent.subject() : "");
            logEntry.setTemplateCode(emailEvent.templateCode() != null ? emailEvent.templateCode() : "");
        } else if (event instanceof InAppNotificationEvent inAppEvent) {
            logEntry.setRecipient(inAppEvent.recipientAccountId() != null ? inAppEvent.recipientAccountId() : "");
            logEntry.setSubject(inAppEvent.title() != null ? inAppEvent.title() : "");
            logEntry.setTemplateCode(inAppEvent.type() != null ? inAppEvent.type() : "IN_APP");
        } else {
            logEntry.setRecipient("");
            logEntry.setSubject("");
            logEntry.setTemplateCode(event.eventType().name());
        }
        return logEntry;
    }
}
