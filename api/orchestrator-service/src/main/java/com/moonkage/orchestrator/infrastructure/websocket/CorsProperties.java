package com.moonkage.orchestrator.infrastructure.websocket;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * The browsers the WebSocket handshake accepts ({@code moonkage.cors.allowed-origins} in application.yml).
 *
 * <p>It used to be read with {@code @Value} in the WebSocket configuration. The gateway reads the same list for its
 * CORS source, so it is a setting of the platform rather than a stray literal: binding it keeps the name and the
 * list behaviour the same.
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "moonkage.cors")
public class CorsProperties {

    /** The origins a browser may open the WebSocket from. */
    @NotEmpty
    private List<String> allowedOrigins = List.of();
}
