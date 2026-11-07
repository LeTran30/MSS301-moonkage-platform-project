package com.moonkage.outbox;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.otel.bridge.OtelCurrentTraceContext;
import io.micrometer.tracing.otel.bridge.OtelTracer;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.samplers.Sampler;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * BE-11: the outbox breaks the link between the request that wrote the event and the moment the relay publishes it.
 * The trace context travels with the row, so the consumer continues the trace of the customer.
 */
class OutboxTraceContextTest {

    private SdkTracerProvider tracerProvider;
    private Tracer tracer;
    private OutboxTraceContext traceContext;

    @BeforeEach
    void setUp() {
        tracerProvider =
                SdkTracerProvider.builder().setSampler(Sampler.alwaysOn()).build();
        OpenTelemetry openTelemetry =
                OpenTelemetrySdk.builder().setTracerProvider(tracerProvider).build();
        tracer = new OtelTracer(openTelemetry.getTracer("test"), new OtelCurrentTraceContext(), event -> {});
        traceContext = new OutboxTraceContext(tracer);
    }

    @AfterEach
    void tearDown() {
        tracerProvider.close();
    }

    @Test
    void theTraceParentOfTheCurrentSpanIsTheHeaderTheConsumerNeeds() {
        Span span = tracer.nextSpan().start();
        try (var scope = tracer.withSpan(span)) {
            String traceParent = traceContext.currentTraceParent();

            assertThat(traceParent).isNotNull();
            assertThat(traceParent)
                    .isEqualTo("00-" + span.context().traceId() + "-"
                            + span.context().spanId() + "-01");
        } finally {
            span.end();
        }
    }

    @Test
    void withoutATraceThereIsNothingToCarry() {
        assertThat(traceContext.currentTraceParent()).isNull();
    }

    @Test
    void theRestoredContextBecomesTheCurrentOneSoThePublishIsItsChild() {
        Span span = tracer.nextSpan().start();
        try (var scope = tracer.withSpan(span)) {
            String traceParent = traceContext.currentTraceParent();

            try (var restored = traceContext.restore(traceParent)) {
                Span current = tracer.currentSpan();

                assertThat(current).isNotNull();
                assertThat(current.context().traceId()).isEqualTo(span.context().traceId());
                assertThat(current.context().spanId()).isEqualTo(span.context().spanId());
            }
        } finally {
            span.end();
        }
    }

    @Test
    void restoringNothingLeavesTheTraceAlone() {
        try (var restored = traceContext.restore(null)) {
            assertThat(tracer.currentSpan()).isNull();
        }
        try (var restored = traceContext.restore("  ")) {
            assertThat(tracer.currentSpan()).isNull();
        }
    }

    @Test
    void aCorruptedHeaderCostsTheEventItsPlaceInTheTraceButNotThePublish() {
        List<String> corrupted = List.of(
                "",
                "not-a-header",
                "00--abc-01",
                "00-0123456789abcdef0123456789abcdef-0123456789abcdef-zz",
                "01-0123456789abcdef0123456789abcdef-0123456789abcdef-01");

        for (String header : corrupted) {
            try (var restored = traceContext.restore(header)) {
                assertThat(tracer.currentSpan()).as(header).isNull();
            }
        }
    }

    @Test
    void theScopeIsClosedSoTheNextEventIsNotPublishedUnderTheWrongTrace() {
        Span span = tracer.nextSpan().start();
        try (var scope = tracer.withSpan(span)) {
            String traceParent = traceContext.currentTraceParent();

            try (var restored = traceContext.restore(traceParent)) {
                assertThat(tracer.currentSpan()).isNotNull();
            }
        } finally {
            span.end();
        }
        assertThat(tracer.currentSpan()).isNull();
    }
}
