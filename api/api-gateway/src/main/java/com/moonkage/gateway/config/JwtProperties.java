package com.moonkage.gateway.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * The token key of the gateway ({@code jwt.secret} in application.yml).
 *
 * <p>It used to be read with {@code @Value} in the decoder bean. It is one value with no sibling to group it with,
 * but it is a secret that belongs to the gateway's own configuration, so it is bound like the rest of the
 * configuration. The name and the behaviour do not change: the key is required and must be a Base64 HS256 secret.
 */
@Validated
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(@NotBlank String secret) {}
