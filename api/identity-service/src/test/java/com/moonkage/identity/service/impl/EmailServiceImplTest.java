package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.config.OtpProperties;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.messaging.EmailNotificationEvent;
import com.moonkage.identity.messaging.EmailNotificationPublisher;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpException;
import org.springframework.context.support.ResourceBundleMessageSource;

class EmailServiceImplTest {

    private final OtpProperties otpProperties = new OtpProperties();
    private final ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();

    private EmailServiceImpl service;
    private AtomicReference<EmailNotificationEvent> publishedEvent;

    @BeforeEach
    void setUp() {
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        publishedEvent = new AtomicReference<>();
        EmailNotificationPublisher publisher = new EmailNotificationPublisher(null) {
            @Override
            public void publish(EmailNotificationEvent event) {
                publishedEvent.set(event);
            }
        };
        service = new EmailServiceImpl(publisher, otpProperties, messageSource);
    }

    @Test
    void sendVerifyAccountOtpPublishesRegistrationEvent() {
        service.sendVerifyAccountOtp("user@moonkage.vn", "Minh", "654321");

        EmailNotificationEvent event = publishedEvent.get();
        assertNotNull(event);
        assertNotNull(event.eventId());
        assertEquals("user@moonkage.vn", event.to());
        assertEquals("MoonKage - Mã xác nhận tài khoản", event.subject());
        assertEquals("REGISTRATION", event.templateCode());
        assertEquals("Minh", event.params().get(EmailNotificationEvent.PARAM_NAME));
        assertEquals("654321", event.params().get(EmailNotificationEvent.PARAM_OTP));
        assertEquals(5L, event.params().get("minutes"));
    }

    @Test
    void sendResetPasswordOtpPublishesForgotPasswordEvent() {
        service.sendResetPasswordOtp("user@moonkage.vn", "Minh", "654321");

        EmailNotificationEvent event = publishedEvent.get();
        assertNotNull(event);
        assertNotNull(event.eventId());
        assertEquals("user@moonkage.vn", event.to());
        assertEquals("MoonKage - Đặt lại mật khẩu", event.subject());
        assertEquals("FORGOT_PASSWORD", event.templateCode());
        assertEquals("Minh", event.params().get(EmailNotificationEvent.PARAM_NAME));
        assertEquals("654321", event.params().get(EmailNotificationEvent.PARAM_OTP));
    }

    @Test
    void sendVerifyAccountOtpThrowsAppExceptionOnBrokerFailure() {
        EmailNotificationPublisher failingPublisher = new EmailNotificationPublisher(null) {
            @Override
            public void publish(EmailNotificationEvent event) {
                throw new AmqpException("Broker unreachable");
            }
        };
        EmailServiceImpl failingService = new EmailServiceImpl(failingPublisher, otpProperties, messageSource);

        assertThrows(
                AppException.class, () -> failingService.sendVerifyAccountOtp("user@moonkage.vn", "Minh", "654321"));
    }
}
