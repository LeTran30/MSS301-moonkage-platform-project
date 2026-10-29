package com.moonkage.identity.otp.application;

import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Accepts a code once; every failure counts toward the lockout. */
@Service
@RequiredArgsConstructor
class VerifyOtp {

    private final OtpStore store;
    private final OtpRules rules;
    private final Clock clock;

    /** Throws INVALID_OR_EXPIRED, or MAX_ATTEMPTS_EXCEEDED once locked out. */
    void handle(OtpPurpose purpose, Email email, OtpCode code) {
        Instant now = Instant.now(clock);
        // the guess is judged inside the atomic update; its outcome comes out through this reference
        AtomicReference<OtpEntry.Guess> result = new AtomicReference<>();
        store.update(
                new OtpKey(purpose, email),
                entry -> {
                    OtpEntry.Guess guess = entry.guess(code, rules, now);
                    result.set(guess);
                    return guess.entry();
                },
                rules.retention());

        OtpEntry.Guess guess = result.get();
        if (guess.outcome() == OtpEntry.Outcome.LOCKED) {
            throw guess.entry().lockedOut(rules, now);
        }
        if (guess.outcome() == OtpEntry.Outcome.MISMATCH) {
            throw new AppException(OtpError.INVALID_OR_EXPIRED);
        }
        // MATCH: accepted, and consumed by the update
    }
}
