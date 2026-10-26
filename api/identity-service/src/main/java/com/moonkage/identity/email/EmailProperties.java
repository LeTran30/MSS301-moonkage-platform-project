package com.moonkage.identity.email;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Configuration for email notifications, reading expiration from {@code otp.expiration}. */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "otp")
class EmailProperties {

    private Duration expiration = Duration.ofMinutes(5);
}
