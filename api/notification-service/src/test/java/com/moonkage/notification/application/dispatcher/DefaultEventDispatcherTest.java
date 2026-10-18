package com.moonkage.notification.application.dispatcher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.moonkage.notification.application.port.AuditLogRepository;
import com.moonkage.notification.application.port.EmailSender;
import com.moonkage.notification.application.port.NotificationEventLogRepository;
import com.moonkage.notification.application.port.TemplateRenderer;
import com.moonkage.notification.channel.audit.AuditEventHandler;
import com.moonkage.notification.channel.email.EmailEventHandler;
import com.moonkage.notification.contract.AuditEvent;
import com.moonkage.notification.contract.EmailNotificationEvent;
import com.moonkage.notification.domain.AuditLog;
import com.moonkage.notification.domain.DeliveryStatus;
import com.moonkage.notification.domain.NotificationEventLog;
import com.moonkage.notification.domain.TemplateRenderException;
import com.moonkage.notification.infrastructure.template.ThymeleafTemplateRenderer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

class DefaultEventDispatcherTest {

    private Map<String, NotificationEventLog> eventLogStore;
    private List<AuditLog> auditLogs;
    private AtomicInteger emailSendCount;
    private DefaultEventDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        this.eventLogStore = new HashMap<>();
        this.auditLogs = new ArrayList<>();
        this.emailSendCount = new AtomicInteger(0);

        NotificationEventLogRepository eventLogRepository = new NotificationEventLogRepository() {
            @Override
            public Optional<NotificationEventLog> findById(String eventId) {
                return Optional.ofNullable(eventLogStore.get(eventId));
            }

            @Override
            public NotificationEventLog save(NotificationEventLog eventLog) {
                eventLogStore.put(eventLog.getEventId(), eventLog);
                return eventLog;
            }
        };

        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        TemplateRenderer renderer = new ThymeleafTemplateRenderer(engine);
        EmailSender emailSender = (to, subject, htmlContent) -> emailSendCount.incrementAndGet();
        AuditLogRepository auditRepository = auditLog -> {
            auditLogs.add(auditLog);
            return auditLog;
        };

        EmailEventHandler emailHandler = new EmailEventHandler(renderer, emailSender);
        AuditEventHandler auditHandler = new AuditEventHandler(auditRepository);

        this.dispatcher = new DefaultEventDispatcher(eventLogRepository, List.of(emailHandler, auditHandler));
    }

    @Test
    @DisplayName("Should skip email sending when event has already been SENT (Idempotency check)")
    void shouldSkipSendingWhenEventAlreadySent() {
        String eventId = "evt-123";
        NotificationEventLog existingLog = new NotificationEventLog();
        existingLog.setEventId(eventId);
        existingLog.setStatus(DeliveryStatus.SENT);
        existingLog.setRecipient("user@example.com");
        eventLogStore.put(eventId, existingLog);

        EmailNotificationEvent event = new EmailNotificationEvent(
                eventId, "user@example.com", "Subject", "REGISTRATION", Map.of("otp", "123456", "name", "John"));

        dispatcher.dispatch(event);

        assertThat(emailSendCount.get()).isZero();
        assertThat(eventLogStore.get(eventId).getStatus()).isEqualTo(DeliveryStatus.SENT);
    }

    @Test
    @DisplayName("Should route EMAIL event, render template, send email, and mark status SENT")
    void shouldDispatchEmailEventAndMarkSent() {
        String eventId = "evt-456";
        EmailNotificationEvent event = new EmailNotificationEvent(
                eventId,
                "user@example.com",
                "Verify Account",
                "REGISTRATION",
                Map.of("otp", "654321", "name", "Nguyen Van A", "minutes", 5));

        dispatcher.dispatch(event);

        assertThat(emailSendCount.get()).isEqualTo(1);
        NotificationEventLog saved = eventLogStore.get(eventId);
        assertThat(saved).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(DeliveryStatus.SENT);
        assertThat(saved.getRecipient()).isEqualTo("user@example.com");
        assertThat(saved.getSentAt()).isNotNull();
    }

    @Test
    @DisplayName("Should mark status FAILED and throw TemplateRenderException when template does not exist")
    void shouldMarkFailedWhenTemplateNotFound() {
        String eventId = "evt-789";
        EmailNotificationEvent event =
                new EmailNotificationEvent(eventId, "user@example.com", "Subject", "NON_EXISTENT_TEMPLATE", Map.of());

        assertThatThrownBy(() -> dispatcher.dispatch(event)).isInstanceOf(TemplateRenderException.class);

        NotificationEventLog saved = eventLogStore.get(eventId);
        assertThat(saved).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(DeliveryStatus.FAILED);
    }

    @Test
    @DisplayName("Should route AUDIT event to AuditEventHandler and persist AuditLog")
    void shouldDispatchAuditEvent() {
        AuditEvent auditEvent = new AuditEvent(
                "catalog-service",
                "acc-001",
                "CREATE_PRODUCT",
                "PRODUCT",
                "prod-1",
                null,
                "{\"name\":\"Mooncake\"}",
                "Initial creation",
                Instant.now());

        dispatcher.dispatch(auditEvent);

        assertThat(auditLogs).hasSize(1);
        assertThat(auditLogs.get(0).getSourceService()).isEqualTo("catalog-service");
        assertThat(auditLogs.get(0).getAction()).isEqualTo("CREATE_PRODUCT");
    }
}
