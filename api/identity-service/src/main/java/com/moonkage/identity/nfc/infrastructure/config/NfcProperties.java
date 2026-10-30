package com.moonkage.identity.nfc.infrastructure.config;

import com.moonkage.identity.nfc.domain.NfcRules;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** The {@code nfc.*} limits of application.yml (demo values of Software Design 4.2). */
@ConfigurationProperties("nfc")
record NfcProperties(Duration sessionTtl, int maxAttempts, Duration lockoutDuration) {

    NfcRules toRules() {
        return new NfcRules(sessionTtl, maxAttempts, lockoutDuration);
    }
}
