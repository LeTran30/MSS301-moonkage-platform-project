package com.moonkage.identity.nfc.infrastructure.config;

import com.moonkage.identity.nfc.domain.NfcRules;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The KYC limits as the domain sees them; a wrong value fails at start-up. */
@Configuration
@EnableConfigurationProperties(NfcProperties.class)
class NfcConfig {

    @Bean
    NfcRules kycRules(NfcProperties properties) {
        return properties.toRules();
    }
}
