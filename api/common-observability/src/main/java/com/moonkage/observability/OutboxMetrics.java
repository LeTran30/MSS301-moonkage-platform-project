package com.moonkage.observability;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicLong;

/**
 * The number of outbox events that are written but not published yet (BE-11b).
 *
 * <p>The relay publishes the oldest event first and marks it published only after the broker confirms it. So a row
 * that stays unpublished means the relay could not send it: the broker is down, it refused the message, or the
 * publisher confirm never came. The count only grows in that case.
 *
 * <p>The value is refreshed by the relay itself instead of by the scrape, because counting the rows on every scrape
 * would put a database query in front of Prometheus. The number is at most one relay interval old.
 *
 * <p>Each service keeps its own instance (one bean), so the gauge is registered once per service.
 */
public class OutboxMetrics {

    private final AtomicLong unpublished = new AtomicLong();

    public OutboxMetrics(MeterRegistry registry) {
        // the AtomicLong is held by this bean, so the gauge's weak reference to it stays alive
        Gauge.builder(MetricNames.OUTBOX_EVENTS_UNPUBLISHED, unpublished, AtomicLong::doubleValue)
                .description("Outbox events written but not published to RabbitMQ yet")
                .register(registry);
    }

    /** The count read from the outbox table by the relay. */
    public void setUnpublished(long count) {
        unpublished.set(count);
    }

    /** The count a scrape reports. */
    public long unpublished() {
        return unpublished.get();
    }
}
