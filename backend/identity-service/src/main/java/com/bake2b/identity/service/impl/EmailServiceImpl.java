package com.bake2b.identity.service.impl;

import com.bake2b.identity.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTPs live in memory keyed by email, like the Capstone project.
 * shortcut: in-memory store is lost on restart and not shared between instances;
 * move to Redis if identity-service is ever scaled to more than one instance.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private record OtpEntry(String otp, Instant expiresAt, int attempts) {
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TemplateEngine templateEngine;
    private final ObjectProvider<JavaMailSender> mailSender;

    final Map<String, OtpEntry> storageMap = new ConcurrentHashMap<>();

    @Value("${otp.expiration}")
    private Duration otpTtl;

    @Value("${otp.max-attempts}")
    private int maxAttempts;

    @Value("${spring.mail.username:}")
    private String from;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Override
    @Async
    public void sendOtpForVerifyAccount(String email, String name, String otp) {
        send(email, name, otp, "REGIS", "MoonKage - Mã xác nhận tài khoản");
    }

    @Override
    @Async
    public void sendOtpForForgotPassword(String email, String name, String otp) {
        send(email, name, otp, "FORGOT_PASSWORD", "MoonKage - Đặt lại mật khẩu");
    }

    private void send(String email, String name, String otp, String template, String subject) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || mailHost.isBlank()) {
            // no SMTP configured (local dev): print the code so the flow can still be tested
            log.warn("[DEV] spring.mail.host not set, OTP for {}: {}", email, otp);
            return;
        }
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("otp", otp);
            context.setVariable("minutes", otpTtl.toMinutes());
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            if (!from.isBlank()) {
                helper.setFrom(from);
            }
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(templateEngine.process(template, context), true);
            sender.send(mimeMessage);
            log.info("{} email sent to {}", template, email);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send {} email to {}: {}", template, email, e.getMessage());
        }
    }

    @Override
    public String generateOTP() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    @Override
    public void storageOtp(String email, String otp) {
        storageMap.put(email, new OtpEntry(otp, Instant.now().plus(otpTtl), 0));
    }

    @Override
    public boolean verifyOtp(String email, String otpVerify) {
        if (email == null || otpVerify == null) {
            return false;
        }
        OtpEntry entry = storageMap.get(email);
        if (entry == null) {
            return false;
        }
        if (Instant.now().isAfter(entry.expiresAt()) || entry.attempts() >= maxAttempts) {
            storageMap.remove(email); // FR-01: expired -> user must request a new code
            return false;
        }
        if (MessageDigest.isEqual(entry.otp().getBytes(), otpVerify.getBytes())) {
            return true;
        }
        storageMap.computeIfPresent(email, (k, e) -> new OtpEntry(e.otp(), e.expiresAt(), e.attempts() + 1));
        return false;
    }

    @Override
    public void clearOtp(String email) {
        if (email != null) {
            storageMap.remove(email);
        }
    }
}
