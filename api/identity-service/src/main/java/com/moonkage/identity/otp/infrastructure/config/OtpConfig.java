package com.moonkage.identity.otp.infrastructure.config;

import com.moonkage.identity.otp.domain.OtpRules;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The OTP limits as the domain sees them; a wrong value fails at start-up. */
@Configuration
@EnableConfigurationProperties(OtpProperties.class)
class OtpConfig {

    @Bean
    OtpRules otpRules(OtpProperties properties) {
        return properties.toRules();
    }
}
