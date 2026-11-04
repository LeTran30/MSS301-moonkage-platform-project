package com.moonkage.observability;

/**
 * The names of the metrics every service publishes (BE-11b).
 *
 * <p>They live in one place so a dashboard or an alert rule is written once and works for all services: the same
 * metric name in two services means the same thing, which is the whole point of a shared name.
 *
 * <p>Prometheus turns dots into underscores, so {@code outbox.events.unpublished} is scraped as
 * {@code outbox_events_unpublished}.
 */
public final class MetricNames {

    /**
     * Events written to the outbox that the relay has not published yet (gauge).
     *
     * <p>This is the earliest sign of BE-01: the relay stops (RabbitMQ is down, the broker rejects the message) and
     * the number only grows. A value above zero for more than a few minutes means an event is waiting to be sent —
     * for {@code quote.accepted} that means a paid deposit without an order.
     */
    public static final String OUTBOX_EVENTS_UNPUBLISHED = "outbox.events.unpublished";

    /** IPNs answered by payment-service, tagged with the result (counter). */
    public static final String PAYMENT_IPN_TOTAL = "payment.ipn";

    /** Payments that reached SUCCEEDED, tagged with the purpose (counter). */
    public static final String PAYMENT_SUCCEEDED_TOTAL = "payment.succeeded";

    /** Orders created, tagged with the kind (counter): BUY_NOW or CUSTOM_ORDER. */
    public static final String ORDER_CREATED_TOTAL = "order.created";

    /** Ledgers whose books do not balance, tagged with the order id (gauge). Never above zero. */
    public static final String LEDGER_BALANCE_MISMATCH_TOTAL = "ledger.balance.mismatch";

    private MetricNames() {
        throw new AssertionError("no instances");
    }
}
