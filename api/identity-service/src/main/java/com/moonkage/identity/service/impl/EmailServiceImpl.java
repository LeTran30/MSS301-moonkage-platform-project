package com.moonkage.identity.service.impl;

import com.moonkage.identity.config.OtpProperties;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.messaging.EmailNotificationEvent;
import com.moonkage.identity.messaging.EmailNotificationPublisher;
import com.moonkage.identity.service.EmailService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

/**
 * Publishes email notification events to RabbitMQ for asynchronous delivery by notification-service. Subjects come
 * from messages.properties, in the locale of the request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final String TEMPLATE_REGISTRATION = "REGISTRATION";
    private static final String TEMPLATE_FORGOT_PASSWORD = "FORGOT_PASSWORD";
    private static final String SUBJECT_REGISTRATION = "email.subject.registration";
    private static final String SUBJECT_FORGOT_PASSWORD = "email.subject.forgot_password";

    private final EmailNotificationPublisher emailNotificationPublisher;
    private final OtpProperties otpProperties;
    private final MessageSource messageSource;

    /** Synchronous broker publish so a broker failure reaches the user, who can then ask for a new code (FR-01). */
    @Override
    public void sendVerifyAccountOtp(String email, String name, String otp) {
        send(email, name, otp, TEMPLATE_REGISTRATION, SUBJECT_REGISTRATION);
    }

    /** Silent on failure: the reply must not reveal whether the email has an account (FR-02). */
    @Override
    public void sendResetPasswordOtp(String email, String name, String otp) {
        try {
            send(email, name, otp, TEMPLATE_FORGOT_PASSWORD, SUBJECT_FORGOT_PASSWORD);
        } catch (AppException e) {
            // already logged in send()
        }
    }

    private void send(String email, String name, String otp, String template, String subjectKey) {
        EmailNotificationEvent event = new EmailNotificationEvent(
                UUID.randomUUID().toString(),
                email,
                messageSource.getMessage(subjectKey, null, LocaleContextHolder.getLocale()),
                template,
                Map.of(
                        EmailNotificationEvent.PARAM_NAME,
                        name,
                        EmailNotificationEvent.PARAM_OTP,
                        otp,
                        EmailNotificationEvent.PARAM_MINUTES,
                        otpProperties.getExpiration().toMinutes()));
        try {
            emailNotificationPublisher.publish(event);
        } catch (AmqpException e) {
            log.error("Failed to publish {} email event to {}: {}", template, email, e.getMessage());
            throw new AppException(ErrorCode.EMAIL_DELIVERY_FAILED, email);
        }
    }
}
