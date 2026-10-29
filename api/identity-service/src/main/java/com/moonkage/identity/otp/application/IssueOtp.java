package com.moonkage.identity.otp.application;

import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.shared.Email;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** A code to send, within the send limits. */
@Service
@RequiredArgsConstructor
class IssueOtp {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpStore store;
    private final OtpRules rules;
    private final Clock clock;

    /** Throws TOO_FREQUENT, SEND_LIMIT_EXCEEDED or MAX_ATTEMPTS_EXCEEDED. */
    OtpCode handle(OtpPurpose purpose, Email email) {
        Instant now = Instant.now(clock);
        return store.update(
                        new OtpKey(purpose, email),
                        entry -> entry.reserveSend(rules, now).withCodeIfNone(() -> OtpCode.random(RANDOM), rules, now),
                        rules.retention())
                .code();
    }
}
