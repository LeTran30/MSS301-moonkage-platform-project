package com.moonkage.order.service.impl;

import com.moonkage.order.client.IdentityClient;
import com.moonkage.order.client.dto.AccountNameView;
import com.moonkage.order.client.dto.VendorView;
import com.moonkage.order.client.facade.VendorDirectory;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.outbound.ChatEvent;
import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.request.StartConversationRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.dto.response.ConversationResponse;
import com.moonkage.order.entity.ChatConversation;
import com.moonkage.order.entity.ChatMessage;
import com.moonkage.order.entity.ChatRead;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.ChatConversationRepository;
import com.moonkage.order.repository.ChatMessageRepository;
import com.moonkage.order.repository.ChatReadRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.ChatService;
import com.moonkage.order.service.ChatSignalPublisher;
import com.moonkage.order.service.OrderFileService;
import com.moonkage.storage.ContentTypeExtensions;
import feign.FeignException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    static final int MAX_PAGE_SIZE = 100;
    static final String MESSAGE = "MESSAGE";
    static final String READ = "READ";
    static final String TYPING = "TYPING";
    /** Files of a conversation live next to the order files, under order/chat-{conversationId}. */
    static final String FILE_FOLDER_PREFIX = "chat-";

    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatReadRepository readRepository;
    private final VendorDirectory vendorDirectory;
    private final IdentityClient identityClient;
    private final OrderFileService fileService;
    private final ChatSignalPublisher signals;

    @Override
    @Transactional
    public ConversationResponse start(CurrentUserInfo caller, StartConversationRequest request) {
        Optional<ChatConversation> existing =
                conversationRepository.findByBuyerAccountIdAndVendorId(caller.accountId(), request.vendorId());
        if (existing.isPresent()) {
            return toConversation(existing.get(), ChatParty.BUYER);
        }
        VendorView vendor =
                vendorDirectory.find(request.vendorId()).orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        if (caller.accountId().equals(vendor.ownerAccountId())) {
            throw new AppException(ErrorCode.CHAT_WITH_OWN_SHOP);
        }
        ChatConversation conversation = new ChatConversation();
        conversation.setId(UUID.randomUUID().toString());
        conversation.setBuyerAccountId(caller.accountId());
        conversation.setBuyerName(nameOf(caller.accountId()));
        conversation.setVendorId(vendor.id());
        conversation.setVendorName(vendor.businessName());
        conversation.setCreatedAt(Instant.now());
        // two tabs starting at once: the unique (buyer, vendor) key refuses the second; pressing again opens it
        return toConversation(conversationRepository.saveAndFlush(conversation), ChatParty.BUYER);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> inbox(CurrentUserInfo caller, ChatParty as) {
        if (as == ChatParty.BUYER) {
            return conversationRepository.findForBuyer(caller.accountId()).stream()
                    .map(c -> toConversation(c, ChatParty.BUYER))
                    .toList();
        }
        return vendorDirectory
                .ownedVendorId(caller.accountId())
                .map(vendorId -> conversationRepository.findForVendor(vendorId).stream()
                        .map(c -> toConversation(c, ChatParty.VENDOR))
                        .toList())
                .orElse(List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse thread(CurrentUserInfo caller, String conversationId, Long beforeSeq, int size) {
        ChatParty party = partyOf(caller, forParty(conversationId));
        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        List<ChatMessage> newestFirst = messageRepository.findPage(
                conversationId, beforeSeq == null ? Long.MAX_VALUE : beforeSeq, PageRequest.of(0, pageSize + 1));
        boolean hasMore = newestFirst.size() > pageSize;
        List<ChatMessage> page = new ArrayList<>(newestFirst.subList(0, Math.min(pageSize, newestFirst.size())));
        Collections.reverse(page);
        return new ChatThreadResponse(
                conversationId,
                party.name(),
                page.stream().map(this::toMessage).toList(),
                readSeqOf(conversationId, ChatParty.BUYER),
                readSeqOf(conversationId, ChatParty.VENDOR),
                hasMore);
    }

    @Override
    @Transactional
    public ChatMessageResponse send(CurrentUserInfo caller, String conversationId, SendChatMessageRequest request) {
        ChatConversation conversation = forParty(conversationId);
        ChatParty party = partyOf(caller, conversation);
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID().toString());
        message.setConversationId(conversationId);
        message.setSenderAccountId(caller.accountId());
        message.setSenderParty(party);
        message.setBody(request.body());
        message.setCreatedAt(Instant.now());
        if (request.attachmentTempKey() != null) {
            String key = fileService.attach(FILE_FOLDER_PREFIX + conversationId, request.attachmentTempKey());
            message.setAttachmentKey(key);
            message.setAttachmentName(request.attachmentName() != null ? request.attachmentName() : fileNameOf(key));
            message.setAttachmentContentType(contentTypeOf(key));
        }
        ChatMessage saved = messageRepository.saveAndFlush(message);
        conversation.setLastMessageAt(saved.getCreatedAt());
        // what one sends, one has read
        readRepository.advance(conversationId, party.name(), saved.getSeq());
        ChatMessageResponse response = toMessage(saved);
        signals.publishAfterCommit(
                RabbitConfig.CHAT_MESSAGE_SENT_ROUTING_KEY,
                event(MESSAGE, conversation, caller, party, bothSides(conversation), response, null));
        return response;
    }

    @Override
    @Transactional
    public void markRead(CurrentUserInfo caller, String conversationId, MarkChatReadRequest request) {
        ChatConversation conversation = forParty(conversationId);
        ChatParty party = partyOf(caller, conversation);
        long upTo = Math.min(request.upToSeq(), messageRepository.lastSeq(conversationId));
        if (upTo > 0 && readRepository.advance(conversationId, party.name(), upTo) > 0) {
            signals.publishAfterCommit(
                    RabbitConfig.CHAT_READ_ROUTING_KEY,
                    event(READ, conversation, caller, party, otherSide(conversation, party), null, upTo));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void typing(CurrentUserInfo caller, String conversationId) {
        ChatConversation conversation = forParty(conversationId);
        ChatParty party = partyOf(caller, conversation);
        signals.publishAfterCommit(
                RabbitConfig.CHAT_TYPING_ROUTING_KEY,
                event(TYPING, conversation, caller, party, otherSide(conversation, party), null, null));
    }

    private ChatConversation forParty(String conversationId) {
        return conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
    }

    /** BUYER or VENDOR; anyone else, admins included, does not see the conversation at all. */
    private ChatParty partyOf(CurrentUserInfo caller, ChatConversation conversation) {
        if (conversation.getBuyerAccountId().equals(caller.accountId())) {
            return ChatParty.BUYER;
        }
        boolean owner = vendorDirectory
                .ownedVendorId(caller.accountId())
                .filter(conversation.getVendorId()::equals)
                .isPresent();
        if (!owner) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        return ChatParty.VENDOR;
    }

    private List<String> bothSides(ChatConversation conversation) {
        List<String> recipients = new ArrayList<>(otherSide(conversation, ChatParty.VENDOR));
        recipients.addAll(otherSide(conversation, ChatParty.BUYER));
        return recipients;
    }

    /** The account on the other side; empty when vendor-service cannot say who owns the Shop. */
    private List<String> otherSide(ChatConversation conversation, ChatParty party) {
        if (party == ChatParty.VENDOR) {
            return List.of(conversation.getBuyerAccountId());
        }
        return vendorDirectory.ownerAccountIdOf(conversation.getVendorId()).stream()
                .toList();
    }

    /** The buyer's display name for the Shop's inbox; null when identity-service cannot say. */
    private String nameOf(String accountId) {
        try {
            AccountNameView view = identityClient.getName(accountId);
            return view == null ? null : view.fullName();
        } catch (FeignException e) {
            log.warn("Name of account {} unknown: {}", accountId, e.getMessage());
            return null;
        }
    }

    private long readSeqOf(String conversationId, ChatParty party) {
        return readRepository
                .findById(new ChatRead.Key(conversationId, party))
                .map(ChatRead::getLastReadSeq)
                .orElse(0L);
    }

    private ConversationResponse toConversation(ChatConversation c, ChatParty myParty) {
        ChatMessageResponse last = messageRepository
                .findFirstByConversationIdOrderBySeqDesc(c.getId())
                .map(this::toMessage)
                .orElse(null);
        long unread = messageRepository.countUnread(c.getId(), myParty, readSeqOf(c.getId(), myParty));
        return new ConversationResponse(
                c.getId(),
                c.getVendorId(),
                c.getVendorName(),
                c.getBuyerAccountId(),
                c.getBuyerName(),
                myParty.name(),
                last,
                c.getLastMessageAt(),
                unread);
    }

    private static ChatEvent event(
            String type,
            ChatConversation conversation,
            CurrentUserInfo caller,
            ChatParty party,
            List<String> recipients,
            ChatMessageResponse message,
            Long readUpToSeq) {
        return new ChatEvent(
                UUID.randomUUID().toString(),
                type,
                conversation.getId(),
                recipients,
                caller.accountId(),
                party.name(),
                message,
                readUpToSeq,
                Instant.now());
    }

    private ChatMessageResponse toMessage(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSeq(),
                message.getConversationId(),
                message.getSenderAccountId(),
                message.getSenderParty().name(),
                message.getBody(),
                message.getAttachmentName(),
                message.getAttachmentContentType(),
                fileService.downloadUrl(message.getAttachmentKey()),
                message.getCreatedAt());
    }

    private static String fileNameOf(String key) {
        return key.substring(key.lastIndexOf('/') + 1);
    }

    private static String contentTypeOf(String key) {
        int dot = key.lastIndexOf('.');
        return dot < 0
                ? DEFAULT_CONTENT_TYPE
                : ContentTypeExtensions.findContentType(key.substring(dot)).orElse(DEFAULT_CONTENT_TYPE);
    }
}
