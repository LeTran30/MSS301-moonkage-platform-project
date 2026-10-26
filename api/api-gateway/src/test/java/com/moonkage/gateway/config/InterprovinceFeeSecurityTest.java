package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@WebFluxTest(
        controllers = InterprovinceFeeSecurityTest.Endpoints.class,
        properties = {
            "jwt.secret=dGVzdC1rZXktdGVzdC1rZXktdGVzdC1rZXktdGVzdC1rZXk=",
            "moonkage.cors.allowed-origins=http://localhost:5173"
        })
@Import({SecurityConfig.class, InterprovinceFeeSecurityTest.Endpoints.class})
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
        for (String path : new String[] {"/api/interprovince-fees", "/catalog-service/api/interprovince-fees"}) {
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
    }
}
