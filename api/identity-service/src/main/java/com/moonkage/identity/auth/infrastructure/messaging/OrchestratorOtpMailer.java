package com.moonkage.identity.auth.infrastructure.messaging;

import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.OtpMailer;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.platform.messaging.RabbitConfig;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.id.IdGenerator;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Hands the mail to orchestrator-service over RabbitMQ, which sends it. Published synchronously, so a broker failure
 * reaches the caller at once (FR-01). Subjects come from messages.properties, in the locale of the request.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class OrchestratorOtpMailer implements OtpMailer {

    /** Consumed by orchestrator-service. */
    static final String ROUTING_KEY = "orchestrator.email.identity";

    private final RabbitTemplate rabbitTemplate;
    private final MessageSource messageSource;
    private final IdGenerator idGenerator;

    @Override
    public void send(OtpMail mail, Email to, String name, OtpCode code, Duration validFor) {
        Template template = Template.of(mail);
        EmailNotificationEvent event = new EmailNotificationEvent(
                idGenerator.next().toString(),
                to.value(),
                messageSource.getMessage(template.subjectKey, null, LocaleContextHolder.getLocale()),
                template.code,
                Map.of(
                        EmailNotificationEvent.PARAM_NAME, name,
                        EmailNotificationEvent.PARAM_OTP, code.value(),
                        EmailNotificationEvent.PARAM_MINUTES, validFor.toMinutes()));
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, ROUTING_KEY, event);
        } catch (AmqpException e) {
            log.error("Failed to publish {} email event to {}: {}", template.code, to.masked(), e.getMessage());
            throw new AppException(AuthError.EMAIL_DELIVERY_FAILED, to.value());
        }
        log.info("Published {} email event {} for {}", template.code, event.eventId(), to.masked());
    }

    /** The orchestrator-service template of each mail, and the key of its subject; one constant per OtpMail. */
    private enum Template {
        ACCOUNT_CONFIRMATION("REGISTRATION", "email.subject.registration"),
        PASSWORD_RESET("FORGOT_PASSWORD", "email.subject.forgot_password");

        private final String code;
        private final String subjectKey;

        Template(String code, String subjectKey) {
            this.code = code;
            this.subjectKey = subjectKey;
        }

        static Template of(OtpMail mail) {
            return valueOf(mail.name());
        }
    }
}
