package com.moonkage.orchestrator.infrastructure.websocket;

import com.moonkage.orchestrator.application.port.RealtimeDestination;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Guards the inbound STOMP frames. The gateway lets {@code /ws} through without a token (a browser cannot set headers
 * on the WebSocket handshake), so the token travels in the CONNECT frame's {@code Authorization} header instead.
 * <ul>
 *   <li>CONNECT: a valid access token, or the client gets an ERROR frame; the STOMP user becomes the account id.
 *   <li>SUBSCRIBE: only {@code /user/queue/**}, so a page can only listen to its own account.
 *   <li>SEND: refused; the browser only listens.
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    static final String BEARER = "Bearer ";
    private static final String USER_QUEUE_PREFIX =
            RealtimeDestination.USER_PREFIX + RealtimeDestination.QUEUE_PREFIX + "/";

    private final AccessTokenVerifier accessTokenVerifier;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }
        switch (accessor.getCommand()) {
            case CONNECT, STOMP -> accessor.setUser(authenticate(accessor));
            case SUBSCRIBE -> checkSubscription(accessor);
            case SEND -> throw new MessagingException("Clients cannot send messages");
            default -> {
                // DISCONNECT, UNSUBSCRIBE, ACK...: nothing to check
            }
        }
        return message;
    }

    private Principal authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        String token = header != null && header.startsWith(BEARER) ? header.substring(BEARER.length()) : null;
        String accountId = accessTokenVerifier
                .accountIdOf(token)
                .orElseThrow(() -> new MessagingException("Missing or invalid access token"));
        return new AccountPrincipal(accountId);
    }

    private static void checkSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (accessor.getUser() == null || destination == null || !destination.startsWith(USER_QUEUE_PREFIX)) {
            throw new MessagingException("Only " + USER_QUEUE_PREFIX + "** can be subscribed");
        }
    }

    /** The STOMP user: its name is the account id, which convertAndSendToUser addresses. */
    record AccountPrincipal(String accountId) implements Principal {

        @Override
        public String getName() {
            return accountId;
        }
    }
}
