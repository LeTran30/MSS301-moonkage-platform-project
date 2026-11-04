package com.moonkage.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * The counters of the money path (BE-11b): payments that succeeded, orders that were created, IPNs by result.
 *
 * <p>{@code order.created} and {@code payment.succeeded} are the two halves of the same question: did a payment
 * arrive without an order, or an order without a payment? A gap between them that lasts longer than a few minutes
 * means money moved but the work it paid for did not happen — or the reverse.
 *
 * <p>The counters are per service, so a dashboard adds them up across services.
 */
public class MoneyMetrics {

    private final MeterRegistry registry;
    private final Counter ipnConfirmed;
    private final Counter ipnRejected;

    public MoneyMetrics(MeterRegistry registry) {
        this.registry = registry;
        ipnConfirmed = Counter.builder(MetricNames.PAYMENT_IPN_TOTAL)
                .tag("result", "confirmed")
                .description("VNPay IPNs answered")
                .register(registry);
        ipnRejected = Counter.builder(MetricNames.PAYMENT_IPN_TOTAL)
                .tag("result", "signature_invalid")
                .description("VNPay IPNs answered")
                .register(registry);
    }

    /** A payment reached SUCCEEDED; the purpose says whether it was a deposit, a checkout or a fee. */
    public void paymentSucceeded(String purpose) {
        registry.counter(MetricNames.PAYMENT_SUCCEEDED_TOTAL, "purpose", purpose)
                .increment();
    }

    /** An order was created; the kind says whether it came from a quote or from a checkout. */
    public void orderCreated(String kind) {
        registry.counter(MetricNames.ORDER_CREATED_TOTAL, "kind", kind).increment();
    }

    /** An IPN arrived with a signature that did not match: either a forgery or a broken key. */
    public void ipnSignatureInvalid() {
        ipnRejected.increment();
    }

    /** An IPN arrived and was recorded. */
    public void ipnConfirmed() {
        ipnConfirmed.increment();
    }
}
