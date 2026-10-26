package com.moonkage.catalog.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogClockConfig {
    @Bean
    Clock catalogClock() {
        return Clock.systemUTC();
    }
}
