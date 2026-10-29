package com.moonkage.identity.kyc.infrastructure.config;

import com.moonkage.identity.kyc.domain.KycRules;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** The {@code nfc.*} limits of application.yml (demo values of Software Design 4.2). */
@ConfigurationProperties("nfc")
record KycProperties(Duration sessionTtl, int maxAttempts, Duration lockoutDuration) {

    KycRules toRules() {
        return new KycRules(sessionTtl, maxAttempts, lockoutDuration);
    }
}
