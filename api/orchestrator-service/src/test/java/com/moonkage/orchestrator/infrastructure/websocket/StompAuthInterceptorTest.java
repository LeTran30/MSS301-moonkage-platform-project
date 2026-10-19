package com.moonkage.orchestrator.infrastructure.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

class StompAuthInterceptorTest {

    private final AccessTokenVerifier verifier = mock(AccessTokenVerifier.class);
    private final StompAuthInterceptor interceptor = new StompAuthInterceptor(verifier);
    private final MessageChannel channel = mock(MessageChannel.class);

    @Test
    @DisplayName("CONNECT with a valid Bearer token makes the account id the STOMP user")
    void connectSetsTheAccountAsUser() {
        when(verifier.accountIdOf("good")).thenReturn(Optional.of("acc-1"));
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader(HttpHeaders.AUTHORIZATION, StompAuthInterceptor.BEARER + "good");

        Message<?> result = interceptor.preSend(message(accessor), channel);

        assertThat(StompHeaderAccessor.wrap(result).getUser()).isNotNull();
        assertThat(StompHeaderAccessor.wrap(result).getUser().getName()).isEqualTo("acc-1");
    }

    @Test
    @DisplayName("CONNECT without a token, or with a bad one, is refused")
    void connectWithoutValidTokenIsRefused() {
        when(verifier.accountIdOf(null)).thenReturn(Optional.empty());
        when(verifier.accountIdOf("bad")).thenReturn(Optional.empty());

        StompHeaderAccessor noHeader = StompHeaderAccessor.create(StompCommand.CONNECT);
        assertThatThrownBy(() -> interceptor.preSend(message(noHeader), channel))
                .isInstanceOf(MessagingException.class);

        StompHeaderAccessor badToken = StompHeaderAccessor.create(StompCommand.CONNECT);
        badToken.addNativeHeader(HttpHeaders.AUTHORIZATION, StompAuthInterceptor.BEARER + "bad");
        assertThatThrownBy(() -> interceptor.preSend(message(badToken), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    @DisplayName("a page may only subscribe to its own /user/queue/** destinations")
    void subscribeOnlyToOwnQueues() {
        assertThat(interceptor.preSend(subscribe("/user/queue/nfc", true), channel))
                .isNotNull();
        assertThatThrownBy(() -> interceptor.preSend(subscribe("/queue/nfc-user123", true), channel))
                .isInstanceOf(MessagingException.class);
        assertThatThrownBy(() -> interceptor.preSend(subscribe("/user/queue/nfc", false), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    @DisplayName("the browser only listens: SEND is refused")
    void sendIsRefused() {
        StompHeaderAccessor send = StompHeaderAccessor.create(StompCommand.SEND);
        send.setDestination("/app/anything");

        assertThatThrownBy(() -> interceptor.preSend(message(send), channel)).isInstanceOf(MessagingException.class);
    }

    private static Message<byte[]> subscribe(String destination, boolean connected) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination(destination);
        if (connected) {
            accessor.setUser(new StompAuthInterceptor.AccountPrincipal("acc-1"));
        }
        return message(accessor);
    }

    private static Message<byte[]> message(StompHeaderAccessor accessor) {
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
