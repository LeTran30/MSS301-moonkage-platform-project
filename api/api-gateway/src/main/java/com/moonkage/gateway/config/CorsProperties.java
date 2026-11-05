package com.moonkage.gateway.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * The browsers the gateway accepts ({@code moonkage.cors.allowed-origins} in application.yml).
 *
 * <p>It used to be read with {@code @Value} in the CORS source bean. The same value is also read by
 * orchestrator-service for the WebSocket handshake, so it is a setting of the platform rather than a stray literal:
 * binding it keeps the name and the list behaviour the same.
 */
@Validated
@ConfigurationProperties(prefix = "moonkage.cors")
public record CorsProperties(@NotEmpty List<String> allowedOrigins) {}
