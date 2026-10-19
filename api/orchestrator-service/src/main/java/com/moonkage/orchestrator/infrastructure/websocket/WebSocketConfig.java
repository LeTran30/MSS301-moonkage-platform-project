package com.moonkage.orchestrator.infrastructure.websocket;

import com.moonkage.orchestrator.application.port.RealtimeDestination;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over a plain WebSocket at {@value #ENDPOINT}, reached through the gateway (Software Design 5.1 rule 9). An
 * in-memory broker is enough: pushes are hints for an open page, the web still polls as a fallback.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String ENDPOINT = "/ws";
    /** Not used by the web (it only listens); declared so a SEND has a well-defined target to be refused on. */
    static final String APPLICATION_PREFIX = "/app";

    private final StompAuthInterceptor stompAuthInterceptor;
    private final List<String> allowedOrigins;

    public WebSocketConfig(
            StompAuthInterceptor stompAuthInterceptor,
            @Value("${moonkage.cors.allowed-origins}") List<String> allowedOrigins) {
        this.stompAuthInterceptor = stompAuthInterceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(ENDPOINT).setAllowedOrigins(allowedOrigins.toArray(String[]::new));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(RealtimeDestination.QUEUE_PREFIX);
        registry.setUserDestinationPrefix(RealtimeDestination.USER_PREFIX);
        registry.setApplicationDestinationPrefixes(APPLICATION_PREFIX);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor);
    }
}
