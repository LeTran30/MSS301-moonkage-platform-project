package com.moonkage.outbox;

import com.moonkage.observability.OutboxMetrics;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends the outbox events of one service to RabbitMQ (Software Design 6): oldest first, each one marked sent only
 * after the broker's publisher confirm.
 *
 * <p>On a failure it stops and retries from that event on the next run, so the order of the events is kept. Runs in
 * one instance of a service (two would send each event twice; consumers skip the repeat by id).
 *
 * <p>The service owns the row (its own {@code outbox_events} table and its own entity), so it implements
 * {@link OutboxEventSource}; this class only knows how to read a batch, publish it and mark what the broker
 * confirmed.
 */
@Slf4j
public class OutboxRelay {

    /** The exchange every service publishes its domain events on (Software Design 5.4). */
    public static final String DEFAULT_EVENTS_EXCHANGE = EventExchange.NAME;

    private final OutboxEventSource eventSource;
    private final RabbitTemplate rabbitTemplate;
    private final OutboxMetrics outboxMetrics;
    private final OutboxTraceContext traceContext;
    private final String eventsExchange;
    private final int batchSize;
    private final Duration confirmTimeout;

    public OutboxRelay(
            OutboxEventSource eventSource,
            RabbitTemplate rabbitTemplate,
            OutboxMetrics outboxMetrics,
            OutboxTraceContext traceContext,
            String eventsExchange,
            int batchSize,
            Duration confirmTimeout) {
        this.eventSource = eventSource;
        this.rabbitTemplate = rabbitTemplate;
        this.outboxMetrics = outboxMetrics;
        this.traceContext = traceContext;
        this.eventsExchange = eventsExchange;
        this.batchSize = batchSize;
        this.confirmTimeout = confirmTimeout;
    }

    @Scheduled(fixedDelayString = "${outbox.relay-interval:2s}")
    @Transactional
    public void relay() {
        List<OutboxEventRow> batch = eventSource.findUnpublished(PageRequest.of(0, batchSize));
        for (OutboxEventRow event : batch) {
            try {
                send(event);
                eventSource.markPublished(event.id(), Instant.now());
            } catch (AmqpException e) {
                eventSource.incrementAttempts(event.id());
                log.warn(
                        "Outbox event {} ({}) not sent, attempt {}: {}",
                        event.id(),
                        event.routingKey(),
                        event.attempts() + 1,
                        e.getMessage());
                publishUnpublishedCount();
                return;
            }
        }
        publishUnpublishedCount();
    }

    /** BE-11b: the gauge that shows the relay is stuck before a customer asks about it. */
    private void publishUnpublishedCount() {
        outboxMetrics.setUnpublished(eventSource.countUnpublished());
    }

    /**
     * Publishes one event, inside the trace of the request that wrote it (BE-11).
     *
     * <p>The relay runs in its own thread, seconds or minutes after the request is gone, so the trace of that request
     * has to travel with the row. It is put back in scope here: the span that the publish creates becomes a child of
     * the span of the request, and the {@code traceparent} that goes on the wire lets the consumer continue the same
     * trace.
     */
    private void send(OutboxEventRow event) {
        try (var scope = traceContext.restore(event.traceParent())) {
            MessageProperties props = new MessageProperties();
            props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
            props.setContentEncoding(StandardCharsets.UTF_8.name());
            props.setMessageId(event.id());
            // the header of the stored trace, so the consumer picks the trace up even if the span below is not sampled
            String traceParent = traceContext.currentTraceParent();
            if (traceParent != null) {
                props.setHeader(OutboxTraceContext.TRACEPARENT, traceParent);
            }
            Message message = new Message(event.payload().getBytes(StandardCharsets.UTF_8), props);
            rabbitTemplate.invoke(ops -> {
                ops.send(eventsExchange, event.routingKey(), message);
                // needs spring.rabbitmq.publisher-confirm-type: simple
                ops.waitForConfirmsOrDie(confirmTimeout.toMillis());
                return null;
            });
        }
    }
}
