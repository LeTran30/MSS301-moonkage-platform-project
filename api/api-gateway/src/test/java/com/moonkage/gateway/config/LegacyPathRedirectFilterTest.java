package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
     * A-1: the four services that had no canonical route now have one, so their legacy form answers the redirect
     * too. Every canonical target of the list is served by an explicit route of {@code application.yml}.
     */
    @Test
    void theLegacyPathsOfTheFourMigratedServicesAreRedirectedToTheCanonicalOnes() {
        for (String[] pair : new String[][] {
            {"/identity-service/api/auth/login", "/api/auth/login"},
            {"/identity-service/api/auth/refresh-token", "/api/auth/refresh-token"},
            {"/identity-service/api/accounts/me", "/api/accounts/me"},
            {"/identity-service/api/addresses", "/api/addresses"},
            {"/identity-service/api/addresses/addr-1", "/api/addresses/addr-1"},
            {"/identity-service/api/nfc/sessions", "/api/nfc/sessions"},
            {"/identity-service/api/nfc/status", "/api/nfc/status"},
            {"/quotation-service/api/quote-requests", "/api/quote-requests"},
            {"/quotation-service/api/quote-requests/req-1/quotes", "/api/quote-requests/req-1/quotes"},
            {"/quotation-service/api/suppliers", "/api/suppliers"},
            {"/order-service/api/carts/me", "/api/carts/me"},
            {"/order-service/api/carts/me/items/line-1", "/api/carts/me/items/line-1"},
            {"/order-service/api/checkouts", "/api/checkouts"},
            {"/order-service/api/orders", "/api/orders"},
            {"/order-service/api/orders/ord-1/dispute", "/api/orders/ord-1/dispute"},
            {"/payment-service/api/payments", "/api/payments"},
            {"/payment-service/api/ledgers", "/api/ledgers"},
            {"/payment-service/api/refunds", "/api/refunds"}
        }) {
            MockServerWebExchange exchange = exchange("GET", pair[0]);

            statusOf(exchange);

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
            assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                    .as("the legacy path %s must lead to %s", pair[0], pair[1])
                    .isEqualTo(pair[1]);
        }
    }

    /**
     * The redirect keeps the method and the query string of the call, so the caller does not notice the migration:
     * a write that is redirected with {@code 301} would arrive as a GET and lose its body.
     */
    @Test
    void theRedirectKeepsTheMethodAndTheQueryString() {
        MockServerWebExchange exchange = exchange("PATCH", "/order-service/api/orders/ord-1?dryRun=true");

        statusOf(exchange);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.PERMANENT_REDIRECT);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.LOCATION))
                .isEqualTo("/api/orders/ord-1?dryRun=true");
        assertThat(exchange.getRequest().getMethod()).isEqualTo(HttpMethod.PATCH);
    }

    /**
     * The rule of the list: a redirect may only name a canonical prefix that the gateway serves. A prefix without a
     * route would send the caller into a 404, which is worse than the answer it replaces.
     */
    @Test
    void everyCanonicalTargetOfTheListIsServedByARoute() {
        String routes = readRoutes();
        for (LegacyPathRedirectFilter.Redirect redirect : LegacyPathRedirectFilter.REDIRECTS) {
            assertThat(routes)
                    .as(
                            "the canonical path %s of the legacy path %s must have a route",
                            redirect.canonical(), redirect.legacy())
                    .contains(redirect.canonical() + "/**");
        }
    }

    /** The path patterns of the explicit routes of {@code application.yml}. */
    private static String readRoutes() {
        try {
            var resource = LegacyPathRedirectFilterTest.class.getClassLoader().getResource("application.yml");
            assertThat(resource)
                    .as("the gateway configuration must be on the classpath")
                    .isNotNull();
            try (var stream = resource.openStream()) {
                return new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            }
        } catch (java.io.IOException e) {
            throw new AssertionError("the gateway configuration could not be read", e);
        }
    }

    /**
     * The services whose canonical path the gateway does not serve yet keep their old form: redirecting them would
     * send the caller into a 404, which is worse than the answer it replaces.
     */
    @Test
    void thePathsOfTheServicesThatHaveNoCanonicalRouteAreNotRedirected() {
        for (String path :
                new String[] {"/orchestrator-service/api/audit-logs", "/identity-service/internal/accounts/check"}) {
            MockServerWebExchange exchange = exchange("GET", path);

            statusOf(exchange);

            assertThat(exchange.getResponse().getStatusCode())
                    .as("the path %s must not be redirected", path)
                    .isNull();
        }
    }

    @Test
    void theCanonicalPathsAreNotTouched() {
        for (String path : new String[] {
            "/api/products",
            "/api/interprovince-fees",
            "/api/vendors",
            "/api/notifications",
            "/api/auth/login",
            "/api/accounts/me",
            "/api/addresses",
            "/api/nfc/sessions",
            "/api/quote-requests",
            "/api/suppliers",
            "/api/carts/me",
            "/api/checkouts",
            "/api/orders",
            "/api/payments",
            "/api/ledgers",
            "/api/refunds",
            "/ws"
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
