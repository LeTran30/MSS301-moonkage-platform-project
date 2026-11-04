package com.moonkage.observability;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.actuate.autoconfigure.metrics.MetricsAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.metrics.export.prometheus.PrometheusMetricsExportAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.metrics.export.simple.SimpleMetricsExportAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

/**
 * Registers the shared metrics in every service that depends on common-observability.
 *
 * <p>The beans are conditional, so a service that wants its own counter (or a test that wants a simple registry)
 * can replace them without touching this class.
 *
 * <p>The {@code after} list matters: without it the auto-configuration would be sorted before Boot's own metrics
 * ones (its package name starts with {@code com.moonkage}, theirs with {@code org.springframework}), and the
 * {@code MeterRegistry} would not exist yet when the condition is checked.
 */
@AutoConfiguration(
        after = {
            MetricsAutoConfiguration.class,
            PrometheusMetricsExportAutoConfiguration.class,
            SimpleMetricsExportAutoConfiguration.class
        })
@ConditionalOnClass(MeterRegistry.class)
@ConditionalOnBean(MeterRegistry.class)
public class ObservabilityAutoConfiguration {

    /**
     * The gauge of the unpublished outbox events.
     *
     * <p>Only services that own an outbox table refresh it; the others simply have no value for it.
     */
    @Bean
    @ConditionalOnMissingBean
    public OutboxMetrics outboxMetrics(MeterRegistry registry) {
        return new OutboxMetrics(registry);
    }

    /** The counters of the money path. */
    @Bean
    @ConditionalOnMissingBean
    public MoneyMetrics moneyMetrics(MeterRegistry registry) {
        return new MoneyMetrics(registry);
    }
}
