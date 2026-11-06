package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.ChatEvent;
import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.entity.ChatMessage;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.ChatMessageRepository;
import com.moonkage.order.repository.ChatReadRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.ChatServiceImpl;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** The chat of an order: only its two sides speak, each push reaches the right accounts. */
class ChatServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);
    private static final CurrentUserInfo STRANGER = new CurrentUserInfo("someone", Role.MEMBER);

    private final ChatMessageRepository messages = mock(ChatMessageRepository.class);
    private final ChatReadRepository reads = mock(ChatReadRepository.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OrderFileService files = mock(OrderFileService.class);
    private final ChatSignalPublisher signals = mock(ChatSignalPublisher.class);
    private final List<ChatMessage> stored = new ArrayList<>();

    private ChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ChatServiceImpl(
                messages, reads, new OrderAccess(orders, vendorDirectory), files, vendorDirectory, signals);
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setBuyerAccountId(BUYER.accountId());
        order.setVendorId(VENDOR_ID);
        when(orders.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(vendorDirectory.ownedVendorId(anyString())).thenReturn(Optional.empty());
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
        when(vendorDirectory.ownerAccountIdOf(VENDOR_ID)).thenReturn(Optional.of(OWNER.accountId()));
        when(messages.saveAndFlush(any(ChatMessage.class))).thenAnswer(call -> {
            ChatMessage m = call.getArgument(0);
            m.setSeq((long) stored.size() + 1);
            stored.add(m);
            return m;
        });
        when(messages.lastSeq(ORDER_ID)).thenAnswer(call -> (long) stored.size());
        when(reads.advance(anyString(), anyString(), anyLong())).thenReturn(1);
    }

    @Test
    void theBuyersMessageReachesBothSidesAndCountsAsReadByTheBuyer() {
        ChatMessageResponse sent =
                service.send(BUYER, ORDER_ID, new SendChatMessageRequest("  Chào shop ", null, null));

        assertEquals("Chào shop", sent.body());
        assertEquals("BUYER", sent.senderParty());
        verify(reads).advance(ORDER_ID, "BUYER", 1L);
        ChatEvent event = pushed(RabbitConfig.CHAT_MESSAGE_SENT_ROUTING_KEY);
        assertEquals(List.of(BUYER.accountId(), OWNER.accountId()), event.recipients());
        assertEquals(sent, event.message());
    }

    @Test
    void aFileIsMovedUnderTheOrderAndKeepsItsName() {
        when(files.attach(ORDER_ID, "tmp/abc.png")).thenReturn("order/order-1/abc.png");
        when(files.downloadUrl("order/order-1/abc.png")).thenReturn("https://minio/abc.png?sig");

        ChatMessageResponse sent =
                service.send(OWNER, ORDER_ID, new SendChatMessageRequest(null, "tmp/abc.png", "mau-hop.png"));

        assertEquals("VENDOR", sent.senderParty());
        assertEquals("mau-hop.png", sent.attachmentName());
        assertEquals("image/png", sent.attachmentContentType());
        assertEquals("https://minio/abc.png?sig", sent.attachmentUrl());
    }

    @Test
    void anAdminReadsTheThreadButCannotWrite() {
        stored.add(message(1, ChatParty.BUYER));

        when(messages.findPage(eq(ORDER_ID), anyLong(), any())).thenReturn(List.copyOf(stored));
        ChatThreadResponse thread = service.thread(ADMIN, ORDER_ID, null, 30);

        assertNull(thread.myParty());
        assertEquals(1, thread.messages().size());
        AppException error = assertThrows(
                AppException.class, () -> service.send(ADMIN, ORDER_ID, new SendChatMessageRequest("hi", null, null)));
        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
    }

    @Test
    void someoneElseDoesNotEvenSeeTheOrder() {
        AppException error = assertThrows(AppException.class, () -> service.thread(STRANGER, ORDER_ID, null, 30));

        assertEquals(ErrorCode.ORDER_NOT_FOUND, error.getErrorCode());
    }

    @Test
    void aPageComesOldestFirstAndSaysWhetherOlderOnesExist() {
        // the repository answers newest first, one more than asked
        when(messages.findPage(eq(ORDER_ID), eq(Long.MAX_VALUE), any()))
                .thenReturn(List.of(
                        message(3, ChatParty.VENDOR), message(2, ChatParty.BUYER), message(1, ChatParty.BUYER)));

        ChatThreadResponse thread = service.thread(BUYER, ORDER_ID, null, 2);

        assertEquals("BUYER", thread.myParty());
        assertEquals(
                List.of(2L, 3L),
                thread.messages().stream().map(ChatMessageResponse::seq).toList());
        assertTrue(thread.hasMore());
    }

    @Test
    void readingTellsOnlyTheOtherSideAndNeverPassesTheLastMessage() {
        stored.add(message(1, ChatParty.VENDOR));

        service.markRead(BUYER, ORDER_ID, new MarkChatReadRequest(99));

        verify(reads).advance(ORDER_ID, "BUYER", 1L);
        ChatEvent event = pushed(RabbitConfig.CHAT_READ_ROUTING_KEY);
        assertEquals(List.of(OWNER.accountId()), event.recipients());
        assertEquals(1L, event.readUpToSeq());
    }

    @Test
    void readingAnEmptyThreadPushesNothing() {
        service.markRead(OWNER, ORDER_ID, new MarkChatReadRequest(5));

        verify(signals, never()).publishAfterCommit(anyString(), any());
    }

    @Test
    void typingGoesToTheBuyerWhenTheVendorTypes() {
        service.typing(OWNER, ORDER_ID);

        assertEquals(
                List.of(BUYER.accountId()),
                pushed(RabbitConfig.CHAT_TYPING_ROUTING_KEY).recipients());
    }

    @Test
    void anEmptyMessageIsRefusedByTheRequest() {
        assertFalse(new SendChatMessageRequest("   ", " ", null).isNotEmpty());
    }

    private ChatEvent pushed(String routingKey) {
        ArgumentCaptor<ChatEvent> event = ArgumentCaptor.forClass(ChatEvent.class);
        verify(signals).publishAfterCommit(eq(routingKey), event.capture());
        return event.getValue();
    }

    private static ChatMessage message(long seq, ChatParty party) {
        ChatMessage m = new ChatMessage();
        m.setId("m" + seq);
        m.setSeq(seq);
        m.setOrderId(ORDER_ID);
        m.setSenderAccountId(party == ChatParty.BUYER ? BUYER.accountId() : OWNER.accountId());
        m.setSenderParty(party);
        m.setBody("tin " + seq);
        m.setCreatedAt(Instant.now());
        return m;
    }
}
