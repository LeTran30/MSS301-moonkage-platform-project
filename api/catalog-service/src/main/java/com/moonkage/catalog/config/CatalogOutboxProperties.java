package com.moonkage.catalog.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "catalog.outbox")
public class CatalogOutboxProperties {
    private static final Duration CONFIRM_TIMEOUT = Duration.ofSeconds(5);

    @Min(1)
    @Max(100)
    private int batchSize = 25;

    /** Each transaction locks only one outbox row for at most this broker wait. */
    public Duration getConfirmTimeout() {
        return CONFIRM_TIMEOUT;
    }
}
