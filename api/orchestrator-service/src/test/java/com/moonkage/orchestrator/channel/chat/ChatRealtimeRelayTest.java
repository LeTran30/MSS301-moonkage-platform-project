package com.moonkage.orchestrator.channel.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.moonkage.orchestrator.application.port.RealtimeDestination;
import com.moonkage.orchestrator.application.port.RealtimePublisher;
import com.moonkage.orchestrator.channel.chat.ChatRealtimeRelay.ChatPush;
import com.moonkage.orchestrator.contract.ChatEvent;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ChatRealtimeRelayTest {

    private final RealtimePublisher publisher = mock(RealtimePublisher.class);
    private final ChatRealtimeRelay relay = new ChatRealtimeRelay(publisher);

    @Test
    void eachRecipientGetsThePushOnceWithoutTheRecipientList() {
        relay.relay(event("READ", Arrays.asList("buyer-1", "buyer-1", " ", null, "owner-1")));

        ArgumentCaptor<Object> push = ArgumentCaptor.forClass(Object.class);
        verify(publisher).publishToUser(eq("buyer-1"), eq(RealtimeDestination.CHAT), push.capture());
        verify(publisher).publishToUser(eq("owner-1"), eq(RealtimeDestination.CHAT), any());
        verify(publisher, times(2)).publishToUser(anyString(), anyString(), any());
        ChatPush sent = (ChatPush) push.getValue();
        assertEquals("order-1", sent.orderId());
        assertEquals(3L, sent.readUpToSeq());
    }

    @Test
    void anEventWithoutRecipientsIsRefused() {
        assertThrows(IllegalArgumentException.class, () -> relay.relay(event("TYPING", null)));
        verify(publisher, never()).publishToUser(anyString(), anyString(), any());
    }

    private static ChatEvent event(String type, List<String> recipients) {
        return new ChatEvent("e1", type, "order-1", recipients, "buyer-1", "BUYER", null, 3L, Instant.now());
    }
}
