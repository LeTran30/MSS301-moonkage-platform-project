package com.moonkage.identity.otp.infrastructure.config;

import com.moonkage.identity.otp.domain.OtpRules;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * OTP limits of registration and password reset ({@code otp.*} in application.yml, documented in docs/auth.md).
 * {@code otp.cleanup-interval} is read by the store's purge job.
 *
 * @param expiration how long a code stays valid
 * @param maxAttempts wrong guesses before the purpose and email are locked out
 * @param maxResendPerHour sends allowed in one hour
 */
@ConfigurationProperties(prefix = "otp")
record OtpProperties(
        Duration expiration, int maxAttempts, Duration resendCooldown, int maxResendPerHour, Duration lockoutDuration) {

    OtpRules toRules() {
        return new OtpRules(expiration, maxAttempts, resendCooldown, maxResendPerHour, lockoutDuration);
    }
}
