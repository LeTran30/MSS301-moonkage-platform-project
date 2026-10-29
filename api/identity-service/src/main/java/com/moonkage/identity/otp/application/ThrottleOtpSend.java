package com.moonkage.identity.otp.application;

import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.shared.Email;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Counts a send that makes no code, so an email without an account answers like one with (FR-02). */
@Service
@RequiredArgsConstructor
class ThrottleOtpSend {

    private final OtpStore store;
    private final OtpRules rules;
    private final Clock clock;

    /** Throws TOO_FREQUENT, SEND_LIMIT_EXCEEDED or MAX_ATTEMPTS_EXCEEDED. */
    void handle(OtpPurpose purpose, Email email) {
        Instant now = Instant.now(clock);
        store.update(new OtpKey(purpose, email), entry -> entry.reserveSend(rules, now), rules.retention());
    }
}
