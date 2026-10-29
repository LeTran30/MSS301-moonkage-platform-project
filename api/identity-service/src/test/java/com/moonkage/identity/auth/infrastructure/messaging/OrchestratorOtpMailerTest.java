package com.moonkage.identity.auth.infrastructure.messaging;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.OtpMailer.OtpMail;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.platform.messaging.RabbitConfig;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.support.ResourceBundleMessageSource;

class OrchestratorOtpMailerTest {

    private static final Email TO = Email.parse("user@moonkage.vn");
    private static final OtpCode CODE = new OtpCode("654321");
    private static final Duration VALID_FOR = Duration.ofMinutes(5);

    private final RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
    private final OrchestratorOtpMailer mailer =
            new OrchestratorOtpMailer(rabbitTemplate, messages(), new SequentialIdGenerator());

    @Test
    void confirmationMailUsesTheRegistrationTemplate() {
        mailer.send(OtpMail.ACCOUNT_CONFIRMATION, TO, "Minh", CODE, VALID_FOR);

        EmailNotificationEvent event = published();
        assertEquals(SequentialIdGenerator.nth(1).toString(), event.eventId());
        assertEquals("user@moonkage.vn", event.to());
        assertEquals("MoonKage - Mã xác nhận tài khoản", event.subject());
        assertEquals("REGISTRATION", event.templateCode());
        assertEquals(
                Map.of(
                        EmailNotificationEvent.PARAM_NAME, "Minh",
                        EmailNotificationEvent.PARAM_OTP, "654321",
                        EmailNotificationEvent.PARAM_MINUTES, 5L),
                event.params());
    }

    @Test
    void resetMailUsesTheForgotPasswordTemplate() {
        mailer.send(OtpMail.PASSWORD_RESET, TO, "Minh", CODE, VALID_FOR);

        EmailNotificationEvent event = published();
        assertEquals("MoonKage - Đặt lại mật khẩu", event.subject());
        assertEquals("FORGOT_PASSWORD", event.templateCode());
    }

    @Test
    void everyMailHasATemplate() {
        for (OtpMail mail : OtpMail.values()) {
            mailer.send(mail, TO, "Minh", CODE, VALID_FOR);
        }
    }

    @Test
    void brokerFailureIsADeliveryFailure() {
        doThrow(new AmqpException("Broker unreachable"))
                .when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), any(Object.class));

        AppException ex = assertThrows(
                AppException.class, () -> mailer.send(OtpMail.ACCOUNT_CONFIRMATION, TO, "Minh", CODE, VALID_FOR));
        assertEquals(AuthError.EMAIL_DELIVERY_FAILED, ex.getErrorCode());
    }

    private EmailNotificationEvent published() {
        ArgumentCaptor<EmailNotificationEvent> event = ArgumentCaptor.forClass(EmailNotificationEvent.class);
        verify(rabbitTemplate)
                .convertAndSend(
                        eq(RabbitConfig.EVENTS_EXCHANGE), eq(OrchestratorOtpMailer.ROUTING_KEY), event.capture());
        return event.getValue();
    }

    private static ResourceBundleMessageSource messages() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        return source;
    }
}
