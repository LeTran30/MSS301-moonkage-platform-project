package com.moonkage.outbox;

import io.micrometer.tracing.CurrentTraceContext;
import io.micrometer.tracing.Tracer;
import java.util.ArrayList;
import java.util.List;

/**
 * Carries the trace context of the request into the outbox row, so the event that leaves the service later
 * still belongs to the trace that caused it (BE-11).
 *
 * <p>The outbox breaks the link between "the request that wrote the row" and "the moment the relay publishes
 * it": the row can wait seconds in the table, and by then the request is long gone. Without this the consumer
 * would start a trace of its own, and the trace of the customer would stop at the service that wrote the event.
 *
 * <p>The context travels as the W3C {@code traceparent} header, the same format the HTTP calls and the AMQP
 * messages already use. That is what makes the whole platform one trace: the mobile app, the gateway, the
 * services and the events are all linked by the same header.
 */
public class OutboxTraceContext {

    /** The W3C header that carries the trace context over HTTP and over AMQP. */
    public static final String TRACEPARENT = "traceparent";

    /** The only version of the header this class reads and writes (W3C Trace Context). */
    private static final String SUPPORTED_VERSION = "00";

    /** The length of the trace id in the header: 16 bytes as hex. */
    private static final int TRACE_ID_LENGTH = 32;

    /** The length of the span id in the header: 8 bytes as hex. */
    private static final int SPAN_ID_LENGTH = 16;

    /** The length of the flags field in the header: one byte as hex. */
    private static final int FLAGS_LENGTH = 2;

    /** The number of parts of a {@code traceparent}: version, trace id, span id and flags. */
    private static final int HEADER_PART_COUNT = 4;

    /** The separator of the parts of a {@code traceparent}. */
    private static final char HEADER_SEPARATOR = '-';

    /** The position of the flags in the header. */
    private static final int FLAGS_PART_INDEX = 3;

    /** The base the flags are read in: they are hex digits. */
    private static final int HEX_RADIX = 16;

    /** The bit of the flags that says the trace is recorded. */
    private static final int SAMPLED_FLAG = 1;

    /** The flags of a trace that is recorded. */
    private static final String FLAGS_SAMPLED = "01";

    /** The flags of a trace that is not recorded. */
    private static final String FLAGS_NOT_SAMPLED = "00";

    private final Tracer tracer;

    public OutboxTraceContext(Tracer tracer) {
        this.tracer = tracer;
    }

    /**
     * A context that carries no trace at all.
     *
     * <p>It is what a service whose tracing is turned off gets, and what a unit test uses when it does not care
     * about the trace.
     *
     * @return the context that never writes and never restores a trace
     */
    public static OutboxTraceContext noop() {
        return new OutboxTraceContext(Tracer.NOOP);
    }

    /**
     * The trace context of the request that is running right now, or {@code null} when nothing is traced.
     *
     * <p>Nothing is traced when the service runs without a tracer (the {@code Tracer.NOOP} of a service whose
     * tracing is turned off) or when the event is written outside a request (a scheduled job, for instance).
     * The event is still published, it just starts a trace of its own.
     *
     * @return the {@code traceparent} value, or {@code null} when there is no trace to carry
     */
    public String currentTraceParent() {
        var span = tracer.currentSpan();
        if (span == null) {
            return null;
        }
        var context = span.context();
        String traceId = context.traceId();
        String spanId = context.spanId();
        if (!isHex(traceId, TRACE_ID_LENGTH) || !isHex(spanId, SPAN_ID_LENGTH)) {
            return null;
        }
        boolean sampled = Boolean.TRUE.equals(context.sampled());
        return SUPPORTED_VERSION + "-" + traceId + "-" + spanId + "-" + (sampled ? FLAGS_SAMPLED : FLAGS_NOT_SAMPLED);
    }

    /**
     * Makes the stored trace context the current one, so the span of the publish becomes a child of it.
     *
     * <p>The scope has to be closed when the publish is done, otherwise the next event on the same thread would
     * be published under the wrong trace.
     *
     * @param traceParent the stored {@code traceparent} value, may be {@code null}
     * @return the scope to close, never {@code null}
     */
    public CurrentTraceContext.Scope restore(String traceParent) {
        if (traceParent == null || traceParent.isBlank()) {
            return CurrentTraceContext.Scope.NOOP;
        }
        try {
            var context = parse(traceParent);
            if (context == null) {
                return CurrentTraceContext.Scope.NOOP;
            }
            return tracer.currentTraceContext().maybeScope(context);
        } catch (RuntimeException exception) {
            // a row written by an older version, or a corrupted one: publish the event without a trace
            return CurrentTraceContext.Scope.NOOP;
        }
    }

    /**
     * The trace context the header describes, or {@code null} when the header is not one this class reads.
     *
     * <p>The header is read and not guessed: a value that is not a W3C {@code traceparent} is ignored, so a
     * corrupted row costs the event its place in the trace but never breaks the publish.
     */
    private io.micrometer.tracing.TraceContext parse(String traceParent) {
        List<String> parts = splitHeader(traceParent);
        if (parts.size() != HEADER_PART_COUNT || !SUPPORTED_VERSION.equals(parts.get(0))) {
            return null;
        }
        String traceId = parts.get(1);
        String spanId = parts.get(2);
        String flags = parts.get(FLAGS_PART_INDEX);
        if (!isHex(traceId, TRACE_ID_LENGTH) || !isHex(spanId, SPAN_ID_LENGTH) || !isHex(flags, FLAGS_LENGTH)) {
            return null;
        }
        boolean sampled = (Integer.parseInt(flags, HEX_RADIX) & SAMPLED_FLAG) != 0;
        return tracer.traceContextBuilder()
                .traceId(traceId)
                .spanId(spanId)
                .sampled(sampled)
                .build();
    }

    /**
     * The parts of the header, split on the separator.
     *
     * <p>The header is split by hand instead of with {@link String#split(String)}, because that method drops the
     * empty parts and a header like {@code 00--abc-01} would then look like a valid one.
     */
    private static List<String> splitHeader(String traceParent) {
        List<String> parts = new ArrayList<>();
        int start = 0;
        for (int index = 0; index < traceParent.length(); index++) {
            if (traceParent.charAt(index) == HEADER_SEPARATOR) {
                parts.add(traceParent.substring(start, index));
                start = index + 1;
            }
        }
        parts.add(traceParent.substring(start));
        return parts;
    }

    /** Whether the text is exactly the given number of hex digits. */
    private static boolean isHex(String text, int length) {
        if (text == null || text.length() != length) {
            return false;
        }
        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);
            boolean hex = (character >= '0' && character <= '9')
                    || (character >= 'a' && character <= 'f')
                    || (character >= 'A' && character <= 'F');
            if (!hex) {
                return false;
            }
        }
        return true;
    }
}
