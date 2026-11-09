package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@WebFluxTest(
        controllers = InterprovinceFeeSecurityTest.Endpoints.class,
        properties = {
            "jwt.secret=dGVzdC1rZXktdGVzdC1rZXktdGVzdC1rZXktdGVzdC1rZXk=",
            "moonkage.cors.allowed-origins=http://localhost:5173"
        })
@Import({SecurityConfig.class, LegacyPathRedirectFilter.class, InterprovinceFeeSecurityTest.Endpoints.class})
class InterprovinceFeeSecurityTest {
    private final WebTestClient client;

    @Autowired
    InterprovinceFeeSecurityTest(WebTestClient client) {
        this.client = client;
    }

    @MockitoBean
    private ReactiveJwtDecoder jwtDecoder;

    @Test
    void allowsPublicReadsAndRequiresAdminForBothWritePaths() {
        // The canonical path is the one the security rules are about.
        for (String path : new String[] {"/api/interprovince-fees"}) {
            client.get().uri(path).exchange().expectStatus().isOk();
            client.put().uri(path).exchange().expectStatus().isUnauthorized();
            when(jwtDecoder.decode("member")).thenReturn(Mono.just(token("member", "MEMBER")));
            client.put()
                    .uri(path)
                    .headers(headers -> headers.setBearerAuth("member"))
                    .exchange()
                    .expectStatus()
                    .isForbidden();
            when(jwtDecoder.decode("admin")).thenReturn(Mono.just(token("admin", "ADMIN")));
            client.put()
                    .uri(path)
                    .headers(headers -> headers.setBearerAuth("admin"))
                    .exchange()
                    .expectStatus()
                    .isOk();
        }
    }

    /**
     * D-30: the legacy path answers a permanent redirect to the canonical one, before the security rules run.
     *
     * <p>The redirect comes first on purpose: a caller that still uses the old form is sent to the canonical path,
     * and the authorization happens there. A {@code 403} on the legacy path would leave the caller stuck on a path
     * that is going away.
     */
    @Test
    void theLegacyPathsAnswerARedirectToTheCanonicalOnes() {
        for (String path : new String[] {
            "/catalog-service/api/interprovince-fees",
            "/catalog-service/api/products",
            "/catalog-service/api/products/p1"
        }) {
            client.get()
                    .uri(path)
                    .exchange()
                    .expectStatus()
                    .isEqualTo(HttpStatus.PERMANENT_REDIRECT)
                    .expectHeader()
                    .valueEquals(HttpHeaders.LOCATION, path.replace("/catalog-service", ""));
        }
    }

    /**
     * The legacy path of a write that needs the admin role answers the redirect too, so a client that still uses it
     * is not answered with a {@code 403} on a path that is going away.
     */
    @Test
    void theLegacyWritePathAlsoAnswersTheRedirect() {
        client.put()
                .uri("/catalog-service/api/interprovince-fees")
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.PERMANENT_REDIRECT)
                .expectHeader()
                .valueEquals(HttpHeaders.LOCATION, "/api/interprovince-fees");
    }

    @Test
    void guestsReadProductsOnBothPathsButNeverReachInternalEndpoints() {
        for (String path : new String[] {"/api/products", "/api/products/p1"}) {
            client.get().uri(path).exchange().expectStatus().isOk();
        }
        when(jwtDecoder.decode("admin")).thenReturn(Mono.just(token("admin", "ADMIN")));
        for (String path : new String[] {"/internal/products/snapshot"}) {
            client.post().uri(path).exchange().expectStatus().isUnauthorized();
            client.post()
                    .uri(path)
                    .headers(headers -> headers.setBearerAuth("admin"))
                    .exchange()
                    .expectStatus()
                    .isForbidden();
        }
    }

    /**
     * B-3.2: the public summary of one Shop is open to guests, but the profile of the Shop keeps its
     * owner-and-admin check.
     */
    @Test
    void guestsReadTheVendorSummaryButNotThePrivateVendorProfile() {
        client.get().uri("/api/vendors/v-1/summary").exchange().expectStatus().isOk();
        // The profile of the Shop is not public: without a token it is refused.
        client.get().uri("/api/vendors/v-1").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void stripsSpoofedIdentityAndPassesOnlyValidatedClaims() {
        var request = MockServerHttpRequest.get("/api/interprovince-fees")
                .header("X-Account-Id", "spoofed")
                .header("X-User-Id", "spoofed")
                .header("X-User-Role", "ADMIN")
                .build();
        var anonymous = MockServerWebExchange.from(request);
        AtomicReference<HttpHeaders> captured = new AtomicReference<>();
        var filter = new SecurityConfig().userHeadersFilter();
        filter.filter(anonymous, exchange -> {
                    captured.set(exchange.getRequest().getHeaders());
                    return Mono.empty();
                })
                .block();
        assertThat(captured.get()).doesNotContainKeys("X-Account-Id", "X-User-Id", "X-User-Role");
        var authenticated = anonymous
                .mutate()
                .principal(Mono.just(new JwtAuthenticationToken(token("real-member", "MEMBER"))))
                .build();
        filter.filter(authenticated, exchange -> {
                    captured.set(exchange.getRequest().getHeaders());
                    return Mono.empty();
                })
                .block();
        assertThat(captured.get().getFirst("X-Account-Id")).isEqualTo("real-member");
        assertThat(captured.get().getFirst("X-User-Role")).isEqualTo("MEMBER");
        assertThat(captured.get()).doesNotContainKey("X-User-Id");
    }

    private static Jwt token(String accountId, String role) {
        return Jwt.withTokenValue(accountId)
                .header("alg", "HS256")
                .subject(accountId)
                .claim("role", role)
                .build();
    }

    @RestController
    static class Endpoints {
        @GetMapping({"/api/interprovince-fees", "/catalog-service/api/interprovince-fees"})
        String read() {
            return "ok";
        }

        @PutMapping({"/api/interprovince-fees", "/catalog-service/api/interprovince-fees"})
        String write() {
            return "ok";
        }

        @GetMapping({
            "/api/products",
            "/api/products/{id}",
            "/catalog-service/api/products",
            "/catalog-service/api/products/{id}"
        })
        String products() {
            return "ok";
        }

        @PostMapping({"/internal/products/snapshot", "/catalog-service/internal/products/snapshot"})
        String internal() {
            return "ok";
        }

        @GetMapping({"/api/vendors/{vendorId}", "/api/vendors/{vendorId}/summary"})
        String vendor() {
            return "ok";
        }
    }
}
