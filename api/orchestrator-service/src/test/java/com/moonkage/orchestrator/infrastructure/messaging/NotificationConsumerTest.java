package com.moonkage.orchestrator.infrastructure.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.moonkage.orchestrator.application.dispatcher.EventDispatcher;
import com.moonkage.orchestrator.contract.BaseEvent;
import com.moonkage.orchestrator.contract.EmailNotificationEvent;
import com.moonkage.orchestrator.domain.TemplateRenderException;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

class NotificationConsumerTest {

    @Test
    @DisplayName("NotificationConsumer should receive EmailNotificationEvent and delegate to EventDispatcher")
    void shouldConsumeAndDelegateToDispatcher() {
        AtomicReference<BaseEvent> captured = new AtomicReference<>();
        EventDispatcher dispatcher = captured::set;
        NotificationConsumer consumer = new NotificationConsumer(dispatcher);

        EmailNotificationEvent event = new EmailNotificationEvent(
                "evt-999", "test@moonkage.vn", "Test Subject", "REGISTRATION", Map.of("otp", "123456"));

        consumer.onEmailEvent(event);

        assertThat(captured.get()).isNotNull();
        assertThat(captured.get().eventId()).isEqualTo("evt-999");
    }

    @Test
    @DisplayName(
            "NotificationConsumer should wrap TemplateRenderException in AmqpRejectAndDontRequeueException for DLQ")
    void shouldWrapTemplateRenderExceptionIntoDontRequeue() {
        EventDispatcher dispatcher = event -> {
            throw new TemplateRenderException("Missing template", new RuntimeException());
        };
        NotificationConsumer consumer = new NotificationConsumer(dispatcher);

        EmailNotificationEvent event =
                new EmailNotificationEvent("evt-bad", "test@moonkage.vn", "Test Subject", "BAD_TEMPLATE", Map.of());

        assertThatThrownBy(() -> consumer.onEmailEvent(event)).isInstanceOf(AmqpRejectAndDontRequeueException.class);
    }
}
