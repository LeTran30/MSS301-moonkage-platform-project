package com.moonkage.identity.kyc.infrastructure.config;

import com.moonkage.identity.kyc.domain.KycRules;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The KYC limits as the domain sees them; a wrong value fails at start-up. */
@Configuration
@EnableConfigurationProperties(KycProperties.class)
class KycConfig {

    @Bean
    KycRules kycRules(KycProperties properties) {
        return properties.toRules();
    }
}
