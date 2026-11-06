package com.moonkage.gateway.config;

import com.moonkage.api.GatewayHeader;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Limits the calls of the endpoints that are worth attacking (BE-07): login, OTP, NFC and the VNPay IPN.
 *
 * <p>The gateway is the single entry point, so a limit here protects every service at once.
 *
 * <p>The counter is per caller: the account id when the request carries a token (so one account cannot be locked
 * out by another one sharing an IP), the IP otherwise (an anonymous caller has nothing else).
 *
 * <p>Limiting is on by default only when {@code moonkage.rate-limit.enabled} is true; a deployment that runs more
 * than one gateway instance behind a load balancer gets a per-instance limit, which is why the switch exists.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter implements GlobalFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** The header that tells the caller how long to wait. */
    static final String RETRY_AFTER_HEADER = "Retry-After";

    /** Milliseconds in a second — used to round the remaining window up to whole seconds. */
    private static final long MILLIS_PER_SECOND = 1000L;

    /** Added before the division so that a partial second rounds up instead of down to zero. */
    private static final long ROUND_UP_OFFSET = MILLIS_PER_SECOND - 1;

    private final RateLimitProperties properties;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final MeterRegistry meterRegistry;

    public RateLimitFilter(RateLimitProperties properties, MeterRegistry meterRegistry) {
        this.properties = properties;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!properties.enabled()) {
            return chain.filter(exchange);
        }
        String path = exchange.getRequest().getPath().value();
        RateLimitProperties.Rule rule = properties
                .rules()
                .resolve(path, exchange.getRequest().getMethod().name());
        if (rule == null || !rule.enabled()) {
            return chain.filter(exchange);
        }

        String caller = callerOf(exchange);
        Window window = windows.computeIfAbsent(
                rule.name() + ':' + caller,
                key -> new Window(rule.calls(), properties.rules().replenishPeriod()));

        if (!window.tryAcquire()) {
            counter(rule.name()).increment();
            log.warn("Rate limit hit: rule={} caller={} path={}", rule.name(), caller, path);
            return reject(exchange, window);
        }
        return chain.filter(exchange);
    }

    /**
     * The caller of the request: the account when the request is authenticated, the IP otherwise.
     *
     * <p>The gateway sets {@code X-Account-Id} from the validated token in {@link SecurityConfig}; that filter runs
     * before this one, so the header is already there when the token was valid.
     */
    private String callerOf(ServerWebExchange exchange) {
        if (properties.rules().keyByAccount()) {
            String accountId = exchange.getRequest().getHeaders().getFirst(GatewayHeader.ACCOUNT_ID);
            if (accountId != null && !accountId.isBlank()) {
                return "account:" + accountId;
            }
        }
        return "ip:" + clientIp(exchange.getRequest());
    }

    private static String clientIp(ServerHttpRequest request) {
        String forwarded = request.getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // the left-most entry is the original caller
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        InetSocketAddress address = request.getRemoteAddress();
        return address == null ? "unknown" : address.getAddress().getHostAddress();
    }

    private Mono<Void> reject(ServerWebExchange exchange, Window window) {
        long retryAfter = window.retryAfterSeconds();
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().set(RETRY_AFTER_HEADER, String.valueOf(retryAfter));
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"message\":\"Too many requests. Try again in %d seconds.\"}".formatted(retryAfter))
                .getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return exchange.getResponse()
                .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    private Counter counter(String rule) {
        return Counter.builder("moonkage.rate.limit.rejected").tag("rule", rule).register(meterRegistry);
    }

    /**
     * A fixed window counter: it counts the calls of one caller and empties itself after the period.
     *
     * <p>A fixed window is enough here: the limit is about "not thousands of calls a second", and it must not cost
     * a round trip to a store.
     */
    private static final class Window {
        private final int limit;
        private final long periodMillis;
        private final java.util.concurrent.atomic.AtomicInteger count = new java.util.concurrent.atomic.AtomicInteger();
        private volatile long windowStart;

        Window(int limit, java.time.Duration replenishPeriod) {
            this.limit = limit;
            this.periodMillis = Math.max(1L, replenishPeriod.toMillis());
            this.windowStart = System.currentTimeMillis();
        }

        boolean tryAcquire() {
            long now = System.currentTimeMillis();
            long start = windowStart;
            if (now - start >= periodMillis) {
                synchronized (this) {
                    if (now - windowStart >= periodMillis) {
                        windowStart = now;
                        count.set(0);
                    }
                }
            }
            return count.incrementAndGet() <= limit;
        }

        long retryAfterSeconds() {
            long remaining = periodMillis - (System.currentTimeMillis() - windowStart);
            return Math.max(1L, (remaining + ROUND_UP_OFFSET) / MILLIS_PER_SECOND);
        }
    }
}
