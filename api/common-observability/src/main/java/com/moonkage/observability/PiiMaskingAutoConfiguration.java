package com.moonkage.observability;

import io.micrometer.observation.ObservationFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

/**
 * Registers the filter that masks the personal data before it lands in a span (BE-11, NFR-03).
 *
 * <p>This is a separate auto-configuration from the metrics one on purpose. The metrics auto-configuration needs
 * a {@code MeterRegistry}, so it only applies to a service that exports metrics; the masking filter has to apply to
 * every service that traces, whether it exports metrics or not. A service that wants its own masking rules can
 * declare its own {@link ObservationFilter} and this one steps aside.
 */
@AutoConfiguration(
        before = org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration.class)
@ConditionalOnClass(ObservationFilter.class)
public class PiiMaskingAutoConfiguration {

    /**
     * The filter that masks the personal data of every observation.
     *
     * <p>Boot collects every {@link ObservationFilter} bean and adds it to the observation registry, and Micrometer
     * runs the filters of an observation before its handlers. The tracing handler is the one that copies the key
     * values onto the span, so a filter masks the data before anything can read it.
     */
    @Bean
    @ConditionalOnMissingBean
    public ObservationFilter piiMaskingObservationFilter() {
        return new PiiMaskingObservationFilter();
    }
}
