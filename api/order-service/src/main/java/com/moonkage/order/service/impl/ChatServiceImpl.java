package com.moonkage.order.service.impl;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.ChatEvent;
import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.entity.ChatMessage;
import com.moonkage.order.entity.ChatRead;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.ChatMessageRepository;
import com.moonkage.order.repository.ChatReadRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.ChatService;
import com.moonkage.order.service.ChatSignalPublisher;
import com.moonkage.order.service.OrderAccess;
import com.moonkage.order.service.OrderFileService;
import com.moonkage.order.service.VendorDirectory;
import com.moonkage.storage.ContentTypeExtensions;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    static final int MAX_PAGE_SIZE = 100;
    static final String MESSAGE = "MESSAGE";
    static final String READ = "READ";
    static final String TYPING = "TYPING";
    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final ChatMessageRepository messageRepository;
    private final ChatReadRepository readRepository;
    private final OrderAccess orderAccess;
    private final OrderFileService fileService;
    private final VendorDirectory vendorDirectory;
    private final ChatSignalPublisher signals;

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse thread(CurrentUserInfo caller, String orderId, Long beforeSeq, int size) {
        Order order = orderAccess.readable(caller, orderId);
        ChatParty party = partyOf(caller, order);
        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        List<ChatMessage> newestFirst = messageRepository.findPage(
                orderId, beforeSeq == null ? Long.MAX_VALUE : beforeSeq, PageRequest.of(0, pageSize + 1));
        boolean hasMore = newestFirst.size() > pageSize;
        List<ChatMessage> page = new ArrayList<>(newestFirst.subList(0, Math.min(pageSize, newestFirst.size())));
        Collections.reverse(page);
        long buyerRead = 0;
        long vendorRead = 0;
        for (ChatRead read : readRepository.findByOrderId(orderId)) {
            if (read.getParty() == ChatParty.BUYER) {
                buyerRead = read.getLastReadSeq();
            } else {
                vendorRead = read.getLastReadSeq();
            }
        }
        return new ChatThreadResponse(
                orderId,
                party == null ? null : party.name(),
                page.stream().map(this::toResponse).toList(),
                buyerRead,
                vendorRead,
                hasMore);
    }

    @Override
    @Transactional
    public ChatMessageResponse send(CurrentUserInfo caller, String orderId, SendChatMessageRequest request) {
        Order order = orderAccess.readable(caller, orderId);
        ChatParty party = writerPartyOf(caller, order);
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID().toString());
        message.setOrderId(orderId);
        message.setSenderAccountId(caller.accountId());
        message.setSenderParty(party);
        message.setBody(request.body());
        message.setCreatedAt(Instant.now());
        if (request.attachmentTempKey() != null) {
            String key = fileService.attach(orderId, request.attachmentTempKey());
            message.setAttachmentKey(key);
            message.setAttachmentName(request.attachmentName() != null ? request.attachmentName() : fileNameOf(key));
            message.setAttachmentContentType(contentTypeOf(key));
        }
        ChatMessage saved = messageRepository.saveAndFlush(message);
        // what one sends, one has read
        readRepository.advance(orderId, party.name(), saved.getSeq());
        ChatMessageResponse response = toResponse(saved);
        signals.publishAfterCommit(
                RabbitConfig.CHAT_MESSAGE_SENT_ROUTING_KEY,
                event(MESSAGE, order, caller, party, bothSides(order), response, null));
        return response;
    }

    @Override
    @Transactional
    public void markRead(CurrentUserInfo caller, String orderId, MarkChatReadRequest request) {
        Order order = orderAccess.readable(caller, orderId);
        ChatParty party = writerPartyOf(caller, order);
        long upTo = Math.min(request.upToSeq(), messageRepository.lastSeq(orderId));
        if (upTo > 0 && readRepository.advance(orderId, party.name(), upTo) > 0) {
            signals.publishAfterCommit(
                    RabbitConfig.CHAT_READ_ROUTING_KEY,
                    event(READ, order, caller, party, otherSide(order, party), null, upTo));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void typing(CurrentUserInfo caller, String orderId) {
        Order order = orderAccess.readable(caller, orderId);
        ChatParty party = writerPartyOf(caller, order);
        signals.publishAfterCommit(
                RabbitConfig.CHAT_TYPING_ROUTING_KEY,
                event(TYPING, order, caller, party, otherSide(order, party), null, null));
    }

    /** BUYER, VENDOR, or null for an admin who is neither. */
    private ChatParty partyOf(CurrentUserInfo caller, Order order) {
        if (orderAccess.isBuyer(caller, order)) {
            return ChatParty.BUYER;
        }
        if (orderAccess.isVendorOwner(caller, order)) {
            return ChatParty.VENDOR;
        }
        return null;
    }

    /** Only the two sides write; an admin reads the thread for a dispute but never speaks in it. */
    private ChatParty writerPartyOf(CurrentUserInfo caller, Order order) {
        ChatParty party = partyOf(caller, order);
        if (party == null) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return party;
    }

    private List<String> bothSides(Order order) {
        List<String> recipients = new ArrayList<>(otherSide(order, ChatParty.VENDOR));
        recipients.addAll(otherSide(order, ChatParty.BUYER));
        return recipients;
    }

    /** The account on the other side; empty when vendor-service cannot say who owns the vendor. */
    private List<String> otherSide(Order order, ChatParty party) {
        if (party == ChatParty.VENDOR) {
            return List.of(order.getBuyerAccountId());
        }
        return vendorDirectory.ownerAccountIdOf(order.getVendorId()).stream().toList();
    }

    private static ChatEvent event(
            String type,
            Order order,
            CurrentUserInfo caller,
            ChatParty party,
            List<String> recipients,
            ChatMessageResponse message,
            Long readUpToSeq) {
        return new ChatEvent(
                UUID.randomUUID().toString(),
                type,
                order.getId(),
                recipients,
                caller.accountId(),
                party.name(),
                message,
                readUpToSeq,
                Instant.now());
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSeq(),
                message.getOrderId(),
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
