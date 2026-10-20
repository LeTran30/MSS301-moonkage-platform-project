package com.moonkage.orchestrator.infrastructure.mail;

import com.moonkage.orchestrator.application.port.EmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * SMTP implementation of EmailSender backed by Spring JavaMailSender.
 * Supports a graceful local development fallback when spring.mail.host is not configured, and never mails the
 * domains of moonkage.mail.blocked-domains (the dev seed accounts).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${moonkage.mail.blocked-domains:}")
    private List<String> blockedDomains;

    @Override
    public void send(String to, String subject, String htmlContent) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            log.warn("[DEV] Mail host not configured. Simulated sending email to '{}' with subject '{}'", to, subject);
            return;
        }
        if (isBlockedRecipient(to)) {
            log.warn(
                    "[DEV] Recipient domain is blocked. Simulated sending email to '{}' with subject '{}'",
                    to,
                    subject);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, StandardCharsets.UTF_8.name());
            if (mailFrom != null && !mailFrom.isBlank()) {
                helper.setFrom(mailFrom);
            }
            helper.setTo(to);
            helper.setSubject(subject != null ? subject : "");
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException | MailException e) {
            log.error("Failed to dispatch SMTP email to {}: {}", to, e.getMessage());
            throw new IllegalStateException("SMTP email delivery failed for " + to, e);
        }
    }

    private boolean isBlockedRecipient(String to) {
        String domain = to == null ? "" : to.substring(to.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);
        return blockedDomains.contains(domain);
    }
}
