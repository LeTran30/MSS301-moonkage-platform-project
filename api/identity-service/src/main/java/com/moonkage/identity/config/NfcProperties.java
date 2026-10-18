package com.moonkage.identity.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * FR-04 limits ({@code nfc.*} in application.yml; demo values of Software Design 4.2). The defaults here only apply
 * when a key is missing from the yml, e.g. in unit tests.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "nfc")
public class NfcProperties {

    /** How long a QR session stays usable (Q-31). */
    private Duration sessionTtl = Duration.ofMinutes(5);

    /** Failed card attempts before verification is locked (AC-04.9, Q-30). */
    private int maxAttempts = 5;

    private Duration lockoutDuration = Duration.ofMinutes(15);
}
