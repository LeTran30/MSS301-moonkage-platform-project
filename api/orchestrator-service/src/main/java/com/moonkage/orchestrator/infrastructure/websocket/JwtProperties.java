package com.moonkage.orchestrator.infrastructure.websocket;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * The token key of orchestrator-service ({@code jwt.secret} in application.yml).
 *
 * <p>It used to be read with {@code @Value} in the WebSocket verifier. It is one value, but it is a secret of the
 * service and not a stray literal, so it is bound like the rest of the configuration. The name and the behaviour do
 * not change: the key is required and must be a Base64 HS256 secret, the same one identity-service signs with.
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /** The Base64 HS256 key, the same one identity-service signs with. */
    @NotBlank
    private String secret;
}
