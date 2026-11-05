package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * D-30: the legacy path that carries the name of the service answers with a permanent redirect to the canonical
 * path, so a client that still calls the old form is sent to the new one.
 *
 * <p>The filter is tested on its own, without the whole gateway: the point is which paths are redirected and which
 * are left alone, not the routing.
 */
class LegacyPathRedirectFilterTest {

    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private LegacyPathRedirectFilter filter;
    private int calls;

    @BeforeEach
    void setUp() {
        filter = new LegacyPathRedirectFilter(new CorsProperties(List.of(ALLOWED_ORIGIN)));
        calls = 0;
    }

    @Test
    void theLegacyProductPathIsRedirectedToTheCanonicalOne() {
        MockServerWebExchange exchange = exchange("GET", "/catalog-service/api/products?provinceCode=01");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                .isEqualTo("/api/products?provinceCode=01");
    }

    @Test
    void aPathBelowTheLegacyOneIsRedirectedToo() {
        MockServerWebExchange exchange = exchange("GET", "/catalog-service/api/products/p-1/reviews");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                .isEqualTo("/api/products/p-1/reviews");
    }

    @Test
    void theLegacyFeePathIsRedirectedToTheCanonicalOne() {
        MockServerWebExchange exchange = exchange("PUT", "/catalog-service/api/interprovince-fees");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                .isEqualTo("/api/interprovince-fees");
    }

    @Test
    void theLegacyVendorPathsAreRedirectedToTheCanonicalOnes() {
        for (String[] pair : new String[][] {
            {"/vendor-service/api/vendors", "/api/vendors"},
            {"/vendor-service/api/registration-fee-config", "/api/registration-fee-config"},
            {"/vendor-service/api/cake-attributes", "/api/cake-attributes"}
        }) {
            MockServerWebExchange exchange = exchange("GET", pair[0]);

            statusOf(exchange);

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
            assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                    .isEqualTo(pair[1]);
        }
    }

    @Test
    void theLegacyNotificationPathIsRedirectedToTheCanonicalOne() {
        MockServerWebExchange exchange = exchange("GET", "/orchestrator-service/api/notifications");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                .isEqualTo("/api/notifications");
    }

    /**
     * The services whose canonical path the gateway does not serve yet keep their old form: redirecting them would
     * send the caller into a 404, which is worse than the answer it replaces.
     */
    @Test
    void thePathsOfTheServicesThatHaveNotMigratedYetAreNotRedirected() {
        for (String path : new String[] {
            "/identity-service/api/auth/login",
            "/quotation-service/api/quote-requests",
            "/quotation-service/api/suppliers",
            "/order-service/api/carts/me",
            "/order-service/api/orders",
            "/payment-service/api/payments",
            "/payment-service/api/refunds"
        }) {
            MockServerWebExchange exchange = exchange("GET", path);

            statusOf(exchange);

            assertThat(exchange.getResponse().getStatusCode())
                    .as("the path %s must not be redirected", path)
                    .isNull();
        }
    }

    @Test
    void theCanonicalPathsAreNotTouched() {
        for (String path :
                new String[] {"/api/products", "/api/interprovince-fees", "/api/vendors", "/api/notifications", "/ws"
                }) {
            MockServerWebExchange exchange = exchange("GET", path);

            statusOf(exchange);

            assertThat(exchange.getResponse().getStatusCode())
                    .as("the canonical path %s must not be redirected", path)
                    .isNull();
        }
    }

    @Test
    void theRequestGoesOnWhenThereIsNothingToRedirect() {
        MockServerWebExchange exchange = exchange("GET", "/api/products");

        filter.filter(exchange, chain -> {
                    calls++;
                    return Mono.empty();
                })
                .block();

        assertThat(calls).isOne();
    }

    @Test
    void theRedirectCarriesTheCorsHeadersOfAnAllowedOrigin() {
        MockServerWebExchange exchange = exchange("GET", "/catalog-service/api/products", ALLOWED_ORIGIN);

        statusOf(exchange);

        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                .isEqualTo(ALLOWED_ORIGIN);
    }

    @Test
    void theRedirectDoesNotEchoAnOriginTheGatewayRefuses() {
        MockServerWebExchange exchange = exchange("GET", "/catalog-service/api/products", "http://evil.example");

        statusOf(exchange);

        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                .isNull();
    }

    /**
     * The preflight is not a call: the browser asks whether the real call may be made. Answering it with a redirect
     * would make the browser follow the redirect and read the CORS headers of the answer, so the preflight is left
     * to the gateway's CORS handling.
     */
    @Test
    void thePreflightIsNotRedirected() {
        MockServerWebExchange exchange = exchange("OPTIONS", "/catalog-service/api/products");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode())
                .as("the preflight must not be redirected")
                .isNull();
    }

    /**
     * The redirect must be the first thing the caller sees: a legacy path that needs a token (the fee table with
     * {@code PUT} is admin only) must not be answered with a {@code 403} before it reaches the redirect.
     */
    @Test
    void theFilterRunsBeforeTheSecurityChain() {
        assertThat(LegacyPathRedirectFilter.class.getAnnotation(Order.class))
                .as("the filter must run at the highest precedence, before the security chain")
                .isNotNull();
        assertThat(LegacyPathRedirectFilter.class.getAnnotation(Order.class).value())
                .isEqualTo(Ordered.HIGHEST_PRECEDENCE);
    }

    private void statusOf(ServerWebExchange exchange) {
        filter.filter(exchange, chain -> {
                    calls++;
                    return Mono.empty();
                })
                .block();
    }

    private static MockServerWebExchange exchange(String method, String path) {
        return exchange(method, path, null);
    }

    private static MockServerWebExchange exchange(String method, String path, String origin) {
        var request = MockServerHttpRequest.method(org.springframework.http.HttpMethod.valueOf(method), path);
        if (origin != null) {
            request.header(HttpHeaders.ORIGIN, origin);
        }
        return MockServerWebExchange.from(request.build());
    }
}
