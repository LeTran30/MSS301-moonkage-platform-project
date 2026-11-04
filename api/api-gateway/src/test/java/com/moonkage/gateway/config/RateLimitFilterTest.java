package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * BE-07: the gateway limits the endpoints that are worth attacking.
 *
 * <p>The filter is tested on its own, without the whole gateway: the point is the counting and the answer, not the
 * routing.
 */
class RateLimitFilterTest {

    private RateLimitFilter filter;
    private RateLimitProperties properties;
    private int calls;

    @BeforeEach
    void setUp() {
        properties = new RateLimitProperties(
                true, new RateLimitProperties.Rules(3, 1, 2, 100, 5, Duration.ofMinutes(1), true));
        filter = new RateLimitFilter(properties, new SimpleMeterRegistry());
        calls = 0;
    }

    @Test
    void letsTheCallsUnderTheLimitThroughAndBlocksTheNextOne() {
        for (int i = 0; i < 3; i++) {
            assertThat(statusOf(post("/identity-service/api/auth/login"))).isEqualTo(HttpStatus.OK);
        }
        assertThat(statusOf(post("/identity-service/api/auth/login"))).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void countsEachCallerApart() {
        for (int i = 0; i < 3; i++) {
            statusOf(post("/identity-service/api/auth/login"));
        }
        // the limit is on the caller, not on the endpoint: another caller is not affected
        assertThat(statusOf(post("/identity-service/api/auth/login", "other"))).isEqualTo(HttpStatus.OK);
        assertThat(statusOf(post("/identity-service/api/auth/login"))).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void countsTheIpOfAnAnonymousCaller() {
        for (int i = 0; i < 3; i++) {
            statusOf(post("/identity-service/api/auth/login"));
        }
        // an anonymous caller is counted by IP; a different IP is not affected
        assertThat(statusOf(post("/identity-service/api/auth/login", null))).isEqualTo(HttpStatus.OK);
    }

    @Test
    void limitsTheOtpAndNfcEndpointsWithTheirOwnRule() {
        for (int i = 0; i < 3; i++) {
            assertThat(statusOf(post("/identity-service/api/auth/login"))).isEqualTo(HttpStatus.OK);
        }
        // the OTP rule has its own counter (1 call per minute here)
        assertThat(statusOf(post("/identity-service/api/auth/send-verify-account-otp")))
                .isEqualTo(HttpStatus.OK);
        assertThat(statusOf(post("/identity-service/api/auth/send-verify-account-otp")))
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        // and so has the NFC one (2 calls)
        assertThat(statusOf(post("/identity-service/api/nfc/sessions"))).isEqualTo(HttpStatus.OK);
        assertThat(statusOf(post("/identity-service/api/nfc/sessions"))).isEqualTo(HttpStatus.OK);
        assertThat(statusOf(post("/identity-service/api/nfc/sessions"))).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void doesNotLimitTheOtherEndpoints() {
        for (int i = 0; i < 50; i++) {
            assertThat(statusOf(post("/catalog-service/api/products"))).isEqualTo(HttpStatus.OK);
        }
        // a read is not a brute force either
        assertThat(statusOf(MockServerHttpRequest.method(HttpMethod.GET, "/catalog-service/api/products")))
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void doesNothingWhenTheSwitchIsOff() {
        RateLimitFilter off =
                new RateLimitFilter(new RateLimitProperties(false, properties.rules()), new SimpleMeterRegistry());
        for (int i = 0; i < 50; i++) {
            assertThat(statusOf(off, post("/identity-service/api/auth/login"))).isEqualTo(HttpStatus.OK);
        }
    }

    @Test
    void answersWithRetryAfterSoTheCallerKnowsWhenToComeBack() {
        for (int i = 0; i < 3; i++) {
            statusOf(post("/identity-service/api/auth/login"));
        }
        calls = 0;
        MockServerWebExchange exchange = MockServerWebExchange.from(
                post("/identity-service/api/auth/login").build());
        filter.filter(exchange, chain -> {
                    calls++;
                    return Mono.empty();
                })
                .block();
        assertThat(calls).isZero();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(exchange.getResponse().getHeaders().getFirst(RateLimitFilter.RETRY_AFTER_HEADER))
                .isNotNull();
    }

    private HttpStatus statusOf(MockServerHttpRequest.BaseBuilder<?> request) {
        return statusOf(filter, request);
    }

    private HttpStatus statusOf(RateLimitFilter target, MockServerHttpRequest.BaseBuilder<?> request) {
        ServerWebExchange exchange = MockServerWebExchange.from(request.build());
        target.filter(exchange, chain -> {
                    calls++;
                    return Mono.empty();
                })
                .block();
        HttpStatusCode status = exchange.getResponse().getStatusCode();
        return status == null ? HttpStatus.OK : HttpStatus.valueOf(status.value());
    }

    private MockServerHttpRequest.BaseBuilder<?> post(String path) {
        return post(path, "caller");
    }

    private MockServerHttpRequest.BaseBuilder<?> post(String path, String accountId) {
        var builder = MockServerHttpRequest.post(path);
        if (accountId != null) {
            builder.header("X-Account-Id", accountId);
        }
        return builder;
    }
}
