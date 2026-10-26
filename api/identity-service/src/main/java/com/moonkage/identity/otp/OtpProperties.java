package com.moonkage.identity.otp;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * OTP of register / forgot password ({@code otp.*} in application.yml, documented in docs/auth.md). The defaults
 * here only apply when a key is missing from the yml, e.g. in unit tests.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "otp")
class OtpProperties {

    private Duration expiration = Duration.ofMinutes(5);

    /** Wrong codes before the email is locked out. */
    private int maxAttempts = 5;

    /** Codes are min .. min + range - 1, i.e. 6 digits. */
    private int min = 100_000;

    private int range = 900_000;

    private Duration resendCooldown = Duration.ofSeconds(60);

    private int maxResendPerHour = 5;

    private Duration lockoutDuration = Duration.ofMinutes(15);
}
