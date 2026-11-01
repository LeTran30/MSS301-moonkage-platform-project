package com.moonkage.identity.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The one source of the current time (TS-01): services read {@code Instant.now(clock)} and pass it to entities, so a
 * test can fix the time. DomainModelArchitectureTest refuses reading the system clock anywhere else.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
