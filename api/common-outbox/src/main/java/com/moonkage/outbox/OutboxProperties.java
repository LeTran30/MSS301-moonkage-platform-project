package com.moonkage.outbox;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The outbox relay settings ({@code outbox.*} in application.yml).
 *
 * <p>The defaults here only apply when a key is missing from the yml, e.g. in unit tests. The relay interval itself
 * is read by {@code @Scheduled} from the yml.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "outbox")
public class OutboxProperties {

    /** The topic exchange the domain events are published on; the same one in every service (Software Design 5.4). */
    private String exchange = OutboxRelay.DEFAULT_EVENTS_EXCHANGE;

    /** Events sent per relay run. */
    private int batchSize = 100;

    /** How long to wait for the broker's publisher confirm of one event. */
    private Duration confirmTimeout = Duration.ofSeconds(5);
}
