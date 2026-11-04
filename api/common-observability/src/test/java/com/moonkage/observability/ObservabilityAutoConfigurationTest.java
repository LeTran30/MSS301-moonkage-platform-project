package com.moonkage.observability;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/** BE-11b: the shared metrics are registered in every service that depends on common-observability. */
class ObservabilityAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    org.springframework.boot.actuate.autoconfigure.metrics.MetricsAutoConfiguration.class,
                    org.springframework.boot.actuate.autoconfigure.metrics.export.prometheus
                            .PrometheusMetricsExportAutoConfiguration.class,
                    ObservabilityAutoConfiguration.class));

    @Test
    void registersTheSharedMetricsWithTheBootRegistry() {
        runner.run(context -> {
            assertNotNull(context.getBean(OutboxMetrics.class));
            assertNotNull(context.getBean(MoneyMetrics.class));
            // the meters must live in the registry Boot exposes at /actuator/prometheus
            MeterRegistry registry = context.getBean(MeterRegistry.class);
            assertNotNull(registry.find(MetricNames.OUTBOX_EVENTS_UNPUBLISHED).gauge());
        });
    }

    @Test
    void thePrometheusRegistryIsTheOneThatIsExposed() {
        runner.run(context -> assertNotNull(context.getBean(PrometheusMeterRegistry.class)));
    }

    @Test
    void theGaugeReportsTheNumberOfUnpublishedEvents() {
        runner.run(context -> {
            OutboxMetrics metrics = context.getBean(OutboxMetrics.class);
            MeterRegistry registry = context.getBean(MeterRegistry.class);

            metrics.setUnpublished(7);

            // the gauge is the earliest sign of a stuck relay (BE-01): it must report the real number
            assertEquals(
                    7.0,
                    registry.find(MetricNames.OUTBOX_EVENTS_UNPUBLISHED).gauge().value());
            assertEquals(7L, metrics.unpublished());
        });
    }

    @Test
    void theMoneyCountersCarryTheirTags() {
        runner.run(context -> {
            MoneyMetrics metrics = context.getBean(MoneyMetrics.class);
            MeterRegistry registry = context.getBean(MeterRegistry.class);

            metrics.paymentSucceeded("DEPOSIT");
            metrics.paymentSucceeded("DEPOSIT");
            metrics.orderCreated("CUSTOM_ORDER");
            metrics.ipnSignatureInvalid();

            // a counter without its tag would mix a deposit with a checkout and hide the difference
            assertEquals(
                    2.0,
                    registry.find(MetricNames.PAYMENT_SUCCEEDED_TOTAL)
                            .tag("purpose", "DEPOSIT")
                            .counter()
                            .count());
            assertEquals(
                    1.0,
                    registry.find(MetricNames.ORDER_CREATED_TOTAL)
                            .tag("kind", "CUSTOM_ORDER")
                            .counter()
                            .count());
            assertEquals(
                    1.0,
                    registry.find(MetricNames.PAYMENT_IPN_TOTAL)
                            .tag("result", "signature_invalid")
                            .counter()
                            .count());
            assertTrue(registry.find(MetricNames.PAYMENT_IPN_TOTAL).counter() != null);
        });
    }
}
