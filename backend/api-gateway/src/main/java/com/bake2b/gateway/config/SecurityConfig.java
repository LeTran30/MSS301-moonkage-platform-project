package com.bake2b.gateway.config;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;

/**
 * Gateway is the single entry point: it validates the access token issued by identity-service
 * and passes the caller's identity downstream as X-User-* headers.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    static final String USER_ID = "X-User-Id";
    static final String ACCOUNT_ID = "X-Account-Id";
    static final String USER_ROLE = "X-User-Role";

    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(c -> {})
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authorizeExchange(a -> a.pathMatchers(HttpMethod.OPTIONS)
                        .permitAll()
                        .pathMatchers("/actuator/health")
                        .permitAll()
                        // /internal/** is for service-to-service (OpenFeign) calls only
                        .pathMatchers("/*/internal/**")
                        .denyAll()
                        // Swagger UI and each service's OpenAPI doc
                        .pathMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/*/v3/api-docs/**")
                        .permitAll()
                        // identity-service decides itself which auth endpoints need a token (/me)
                        .pathMatchers("/identity-service/api/auth/**")
                        .permitAll()
                        // FR-04: guests browse products before logging in
                        .pathMatchers(
                                HttpMethod.GET,
                                "/catalog-service/api/products/**",
                                "/catalog-service/api/order-profiles/**",
                                "/catalog-service/api/reviews/**")
                        .permitAll()
                        // shop product management: role SELLER only (catalog-service also checks the vendor is
                        // approved)
                        .pathMatchers("/catalog-service/api/seller/**")
                        .hasRole("SELLER")
                        .anyExchange()
                        .authenticated())
                // role claim is a single string ("CUSTOMER"/"ADMIN") -> ROLE_CUSTOMER / ROLE_ADMIN
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    /** Same Base64 HS256 key as identity-service (jwt.secret). Only ACCESS tokens pass; refresh tokens are refused. */
    @Bean
    ReactiveJwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withSecretKey(
                        new SecretKeySpec(Base64.getDecoder().decode(secret), "HmacSHA256"))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        OAuth2TokenValidator<Jwt> accessOnly = jwt -> "ACCESS".equals(jwt.getClaimAsString("type"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Not an access token", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), accessOnly));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${moonkage.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cfg.setMaxAge(Duration.ofHours(1));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    /**
     * Strips any client-supplied X-User-* headers (spoofing) and sets them from the validated JWT.
     * Downstream services read identity only from these headers.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    GlobalFilter userHeadersFilter() {
        return (exchange, chain) -> exchange.getPrincipal()
                .filter(JwtAuthenticationToken.class::isInstance)
                .map(p -> withUserHeaders(exchange, ((JwtAuthenticationToken) p).getToken()))
                .defaultIfEmpty(withUserHeaders(exchange, null))
                .flatMap(chain::filter);
    }

    private static ServerWebExchange withUserHeaders(ServerWebExchange exchange, Jwt jwt) {
        // incoming headers are read-only, so build a fresh copy
        HttpHeaders headers = new HttpHeaders();
        headers.addAll(exchange.getRequest().getHeaders());
        headers.remove(USER_ID);
        headers.remove(ACCOUNT_ID);
        headers.remove(USER_ROLE);
        if (jwt != null) {
            headers.set(USER_ID, jwt.getClaimAsString("userId"));
            headers.set(ACCOUNT_ID, jwt.getClaimAsString("accountId"));
            headers.set(USER_ROLE, jwt.getClaimAsString("role"));
        }
        HttpHeaders readOnly = HttpHeaders.readOnlyHttpHeaders(headers);
        ServerHttpRequest request = new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            public HttpHeaders getHeaders() {
                return readOnly;
            }
        };
        return exchange.mutate().request(request).build();
    }

    private static ReactiveJwtAuthenticationConverterAdapter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("role");
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(roles);
        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }
}
