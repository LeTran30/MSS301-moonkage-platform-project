package com.moonkage.notification.channel.email;

import com.moonkage.notification.application.port.EmailSender;
import com.moonkage.notification.application.port.EventHandler;
import com.moonkage.notification.application.port.TemplateRenderer;
import com.moonkage.notification.contract.EmailNotificationEvent;
import com.moonkage.notification.contract.EventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Channel handler dedicated to processing EMAIL events:
 * compiles HTML via TemplateRenderer and dispatches via EmailSender.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventHandler implements EventHandler<EmailNotificationEvent> {

    private final TemplateRenderer templateRenderer;
    private final EmailSender emailSender;

    @Override
    public EventType supports() {
        return EventType.EMAIL;
    }

    @Override
    public void handle(EmailNotificationEvent event) {
        if (event.to() == null || event.to().isBlank()) {
            throw new IllegalArgumentException("Recipient email 'to' is required for event " + event.eventId());
        }
        if (event.templateCode() == null || event.templateCode().isBlank()) {
            throw new IllegalArgumentException("Template code is required for event " + event.eventId());
        }

        String htmlContent = templateRenderer.render(event.templateCode(), event.params());
        emailSender.send(event.to(), event.subject(), htmlContent);
        log.info("Email channel processed event [{}] for recipient {}", event.eventId(), event.to());
    }
}
