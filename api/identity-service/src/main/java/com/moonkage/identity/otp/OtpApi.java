package com.moonkage.identity.otp;

import com.moonkage.identity.shared.Email;
import java.time.Duration;

/**
 * One-time codes of registration and password reset (FR-01, FR-02; plan v2, 4.5). Codes, counters and lockouts are
 * kept per purpose and email: a code never works for another purpose (Q-05).
 */
public interface OtpApi {

    /**
     * A code to send. Asking again while a code is still valid gives the same code, so it never resets the
     * wrong-guess counter. Throws TOO_FREQUENT (cooldown), SEND_LIMIT_EXCEEDED (hourly quota) or
     * MAX_ATTEMPTS_EXCEEDED (locked out).
     */
    OtpCode issue(OtpPurpose purpose, Email email);

    /**
     * Counts a send without making a code, with the same limits as {@link #issue}. For an email that gets no code
     * (no account), so the reply cannot reveal whether an account exists (FR-02).
     */
    void throttle(OtpPurpose purpose, Email email);

    /**
     * Accepts the code once and consumes it. Any failure, an email without a pending code included, counts as a
     * wrong guess. Throws INVALID_OR_EXPIRED, or MAX_ATTEMPTS_EXCEEDED once locked out.
     */
    void verify(OtpPurpose purpose, Email email, OtpCode code);

    /** Drops the pending code, e.g. it could not be delivered. The counters stay, so a lockout or quota holds. */
    void discard(OtpPurpose purpose, Email email);

    /** How long an issued code stays valid, e.g. for the mail that carries it. */
    Duration codeLifetime();
}
