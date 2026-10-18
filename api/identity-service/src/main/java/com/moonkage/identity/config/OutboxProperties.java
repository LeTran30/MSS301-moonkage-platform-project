package com.moonkage.identity.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Outbox relay ({@code outbox.*} in application.yml). The defaults here only apply when a key is missing from the
 * yml, e.g. in unit tests. The relay interval itself is read by {@code @Scheduled} from the yml.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "outbox")
public class OutboxProperties {

    /** Events sent per relay run. */
    private int batchSize = 100;

    /** How long to wait for the broker's publisher confirm of one event. */
    private Duration confirmTimeout = Duration.ofSeconds(5);
}
