package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

import com.moonkage.order.client.IdentityClient;
import com.moonkage.order.client.dto.AccountNameView;
import com.moonkage.order.client.dto.VendorView;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.ChatEvent;
import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.request.StartConversationRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.dto.response.ConversationResponse;
import com.moonkage.order.entity.ChatConversation;
import com.moonkage.order.entity.ChatMessage;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.ChatConversationRepository;
import com.moonkage.order.repository.ChatMessageRepository;
import com.moonkage.order.repository.ChatReadRepository;
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

/** One conversation per buyer and Shop: only its two sides see it, each push reaches the right accounts. */
class ChatServiceImplTest {

    private static final String CONVERSATION_ID = "conv-1";
    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);

    private final ChatConversationRepository conversations = mock(ChatConversationRepository.class);
    private final ChatMessageRepository messages = mock(ChatMessageRepository.class);
    private final ChatReadRepository reads = mock(ChatReadRepository.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final IdentityClient identityClient = mock(IdentityClient.class);
    private final OrderFileService files = mock(OrderFileService.class);
    private final ChatSignalPublisher signals = mock(ChatSignalPublisher.class);
    private final List<ChatMessage> stored = new ArrayList<>();

    private ChatServiceImpl service;
    private ChatConversation conversation;

    @BeforeEach
    void setUp() {
        service = new ChatServiceImpl(conversations, messages, reads, vendorDirectory, identityClient, files, signals);
        conversation = new ChatConversation();
        conversation.setId(CONVERSATION_ID);
        conversation.setBuyerAccountId(BUYER.accountId());
        conversation.setVendorId(VENDOR_ID);
        conversation.setVendorName("Trăng Vàng");
        conversation.setCreatedAt(Instant.now());
        when(conversations.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(vendorDirectory.ownedVendorId(anyString())).thenReturn(Optional.empty());
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
        when(vendorDirectory.ownerAccountIdOf(VENDOR_ID)).thenReturn(Optional.of(OWNER.accountId()));
        when(vendorDirectory.find(VENDOR_ID))
                .thenReturn(Optional.of(new VendorView(VENDOR_ID, OWNER.accountId(), "Trăng Vàng", true)));
        when(messages.saveAndFlush(any(ChatMessage.class))).thenAnswer(call -> {
            ChatMessage m = call.getArgument(0);
            m.setSeq((long) stored.size() + 1);
            stored.add(m);
            return m;
        });
        when(messages.lastSeq(CONVERSATION_ID)).thenAnswer(call -> (long) stored.size());
        when(reads.advance(anyString(), anyString(), anyLong())).thenReturn(1);
        when(conversations.saveAndFlush(any(ChatConversation.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void nhanShopOpensANewConversationWithTheShopAndBuyerNames() {
        when(conversations.findByBuyerAccountIdAndVendorId("someone", VENDOR_ID))
                .thenReturn(Optional.empty());
        when(identityClient.getName("someone")).thenReturn(new AccountNameView("someone", "Nguyễn Lan"));

        ConversationResponse started =
                service.start(new CurrentUserInfo("someone", Role.MEMBER), new StartConversationRequest(VENDOR_ID));

        assertEquals("Trăng Vàng", started.vendorName());
        assertEquals("Nguyễn Lan", started.buyerName());
        assertEquals("BUYER", started.myParty());
        assertEquals(0, started.unreadCount());
    }

    @Test
    void nhanShopAgainOpensTheSameConversation() {
        when(conversations.findByBuyerAccountIdAndVendorId(BUYER.accountId(), VENDOR_ID))
                .thenReturn(Optional.of(conversation));

        ConversationResponse started = service.start(BUYER, new StartConversationRequest(VENDOR_ID));

        assertEquals(CONVERSATION_ID, started.id());
        verify(conversations, never()).saveAndFlush(any());
    }

    @Test
    void anOwnerCannotChatWithTheirOwnShop() {
        AppException error =
                assertThrows(AppException.class, () -> service.start(OWNER, new StartConversationRequest(VENDOR_ID)));

        assertEquals(ErrorCode.CHAT_WITH_OWN_SHOP, error.getErrorCode());
    }

    @Test
    void aShopThatDoesNotExistIsNotFound() {
        when(vendorDirectory.find("nope")).thenReturn(Optional.empty());

        AppException error =
                assertThrows(AppException.class, () -> service.start(BUYER, new StartConversationRequest("nope")));

        assertEquals(ErrorCode.SHOP_NOT_FOUND, error.getErrorCode());
    }

    @Test
    void theBuyersMessageReachesBothSidesAndMovesTheConversationUp() {
        ChatMessageResponse sent =
                service.send(BUYER, CONVERSATION_ID, new SendChatMessageRequest("  Chào shop ", null, null));

        assertEquals("Chào shop", sent.body());
        assertEquals("BUYER", sent.senderParty());
        assertEquals(sent.createdAt(), conversation.getLastMessageAt());
        verify(reads).advance(CONVERSATION_ID, "BUYER", 1L);
        ChatEvent event = pushed(RabbitConfig.CHAT_MESSAGE_SENT_ROUTING_KEY);
        assertEquals(List.of(BUYER.accountId(), OWNER.accountId()), event.recipients());
        assertEquals(sent, event.message());
    }

    @Test
    void aFileIsKeptUnderTheConversationWithItsName() {
        when(files.attach("chat-" + CONVERSATION_ID, "tmp/abc.png")).thenReturn("order/chat-conv-1/abc.png");
        when(files.downloadUrl("order/chat-conv-1/abc.png")).thenReturn("https://minio/abc.png?sig");

        ChatMessageResponse sent =
                service.send(OWNER, CONVERSATION_ID, new SendChatMessageRequest(null, "tmp/abc.png", "mau-hop.png"));

        assertEquals("VENDOR", sent.senderParty());
        assertEquals("mau-hop.png", sent.attachmentName());
        assertEquals("image/png", sent.attachmentContentType());
        assertEquals("https://minio/abc.png?sig", sent.attachmentUrl());
    }

    @Test
    void noOneElseSeesTheConversationNotEvenAnAdmin() {
        AppException error = assertThrows(AppException.class, () -> service.thread(ADMIN, CONVERSATION_ID, null, 30));

        assertEquals(ErrorCode.CONVERSATION_NOT_FOUND, error.getErrorCode());
    }

    @Test
    void aPageComesOldestFirstAndSaysWhetherOlderOnesExist() {
        when(messages.findPage(eq(CONVERSATION_ID), eq(Long.MAX_VALUE), any()))
                .thenReturn(List.of(
                        message(3, ChatParty.VENDOR), message(2, ChatParty.BUYER), message(1, ChatParty.BUYER)));

        ChatThreadResponse thread = service.thread(OWNER, CONVERSATION_ID, null, 2);

        assertEquals("VENDOR", thread.myParty());
        assertEquals(
                List.of(2L, 3L),
                thread.messages().stream().map(ChatMessageResponse::seq).toList());
        assertTrue(thread.hasMore());
    }

    @Test
    void theShopInboxCountsWhatTheBuyerSentSinceTheShopRead() {
        conversation.setLastMessageAt(Instant.now());
        when(conversations.findForVendor(VENDOR_ID)).thenReturn(List.of(conversation));
        when(messages.countUnread(CONVERSATION_ID, ChatParty.VENDOR, 0L)).thenReturn(2L);

        List<ConversationResponse> inbox = service.inbox(OWNER, ChatParty.VENDOR);

        assertEquals(1, inbox.size());
        assertEquals(2, inbox.get(0).unreadCount());
        assertEquals("VENDOR", inbox.get(0).myParty());
    }

    @Test
    void someoneWithoutAShopHasAnEmptyShopInbox() {
        assertEquals(List.of(), service.inbox(BUYER, ChatParty.VENDOR));
    }

    @Test
    void readingTellsOnlyTheOtherSideAndNeverPassesTheLastMessage() {
        stored.add(message(1, ChatParty.VENDOR));

        service.markRead(BUYER, CONVERSATION_ID, new MarkChatReadRequest(99));

        verify(reads).advance(CONVERSATION_ID, "BUYER", 1L);
        ChatEvent event = pushed(RabbitConfig.CHAT_READ_ROUTING_KEY);
        assertEquals(List.of(OWNER.accountId()), event.recipients());
        assertEquals(1L, event.readUpToSeq());
    }

    @Test
    void readingAnEmptyConversationPushesNothing() {
        service.markRead(OWNER, CONVERSATION_ID, new MarkChatReadRequest(5));

        verify(signals, never()).publishAfterCommit(anyString(), any());
    }

    @Test
    void typingGoesToTheBuyerWhenTheShopTypes() {
        service.typing(OWNER, CONVERSATION_ID);

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
        m.setConversationId(CONVERSATION_ID);
        m.setSenderAccountId(party == ChatParty.BUYER ? BUYER.accountId() : OWNER.accountId());
        m.setSenderParty(party);
        m.setBody("tin " + seq);
        m.setCreatedAt(Instant.now());
        return m;
    }
}
