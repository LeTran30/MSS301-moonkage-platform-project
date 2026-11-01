package com.moonkage.identity.email;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

/**
 * Publishes email notification events to RabbitMQ for asynchronous delivery by orchestrator-service. Subjects come
 * from messages.properties, in the locale of the request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class EmailServiceImpl implements EmailService {

    private static final String TEMPLATE_REGISTRATION = "REGISTRATION";
    private static final String TEMPLATE_FORGOT_PASSWORD = "FORGOT_PASSWORD";
    private static final String SUBJECT_REGISTRATION = "email.subject.registration";
    private static final String SUBJECT_FORGOT_PASSWORD = "email.subject.forgot_password";

    private final EmailNotificationPublisher emailNotificationPublisher;
    private final EmailProperties emailProperties;
    private final MessageSource messageSource;

    /** Synchronous broker publish so a broker failure reaches the user, who can then ask for a new code (FR-01). */
    @Override
    public void sendVerifyAccountOtp(Email email, String name, String otp) {
        send(email, name, otp, TEMPLATE_REGISTRATION, SUBJECT_REGISTRATION);
    }

    /** Silent on failure: the reply must not reveal whether the email has an account (FR-02). */
    @Override
    public void sendResetPasswordOtp(Email email, String name, String otp) {
        try {
            send(email, name, otp, TEMPLATE_FORGOT_PASSWORD, SUBJECT_FORGOT_PASSWORD);
        } catch (AppException e) {
            // already logged in send()
        }
    }

    private void send(Email email, String name, String otp, String template, String subjectKey) {
        Objects.requireNonNull(email, "email must not be null");
        EmailNotificationEvent event = new EmailNotificationEvent(
                UUID.randomUUID().toString(),
                email.value(),
                messageSource.getMessage(subjectKey, null, LocaleContextHolder.getLocale()),
                template,
                Map.of(
                        EmailNotificationEvent.PARAM_NAME,
                        name,
                        EmailNotificationEvent.PARAM_OTP,
                        otp,
                        EmailNotificationEvent.PARAM_MINUTES,
                        emailProperties.getExpiration().toMinutes()));
        try {
            emailNotificationPublisher.publish(event);
        } catch (AmqpException e) {
            log.error("Failed to publish {} email event to {}: {}", template, email.value(), e.getMessage());
            throw new AppException(ErrorCode.EMAIL_DELIVERY_FAILED, email.value());
        }
    }
}
