package com.moonkage.outbox;

import com.moonkage.observability.ObservabilityAutoConfiguration;
import com.moonkage.observability.OutboxMetrics;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * Registers the outbox relay in every service that owns an {@code outbox_events} table.
 *
 * <p>The service provides the {@link OutboxEventSource} (its own repository); this configuration supplies the relay
 * itself, so the publishing logic lives in one place instead of one copy per service.
 *
 * <p>Turn the relay off with {@code outbox.enabled=false} (a service that only consumes events does not need it).
 */
@AutoConfiguration(after = ObservabilityAutoConfiguration.class)
@ConditionalOnClass(RabbitTemplate.class)
@EnableConfigurationProperties(OutboxProperties.class)
public class OutboxAutoConfiguration {

    /**
     * The relay, but only when the service has an outbox table to read.
     *
     * <p>It has to come after the metrics auto-configuration of common-observability (its package name starts with
     * {@code com.moonkage}, theirs with {@code org.springframework}), otherwise the {@code MeterRegistry} would not
     * exist yet when the condition is checked.
     */
    @Bean
    @ConditionalOnBean(OutboxEventSource.class)
    @ConditionalOnMissingBean
    @ConditionalOnProperty(prefix = "outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
    public OutboxRelay outboxRelay(
            OutboxEventSource eventSource,
            RabbitTemplate rabbitTemplate,
            OutboxMetrics outboxMetrics,
            OutboxProperties properties) {
        return new OutboxRelay(
                eventSource,
                rabbitTemplate,
                outboxMetrics,
                properties.getExchange(),
                properties.getBatchSize(),
                properties.getConfirmTimeout());
    }
}
