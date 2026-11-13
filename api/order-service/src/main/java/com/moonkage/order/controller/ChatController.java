package com.moonkage.order.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.request.StartConversationRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.dto.response.ConversationResponse;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chat between a buyer and a Shop, one conversation per pair, open before any order. Files go through
 * POST /api/orders/uploads first, then their tempKey rides on the message. New messages, reads and typing are pushed
 * on STOMP /user/queue/chat.
 */
@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ChatController {

    private static final String DEFAULT_PAGE_SIZE = "30";

    private final ChatService chatService;

    /** "Nhắn shop": opens the caller's conversation with the Shop, the same one every time. */
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ApiResponse<ConversationResponse> start(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody StartConversationRequest request) {
        return ApiResponse.ok(chatService.start(caller, request));
    }

    /** {@code as=BUYER}: the Shops the caller wrote to; {@code as=VENDOR}: the buyers of the caller's Shop. */
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ApiResponse<List<ConversationResponse>> inbox(
            @CurrentUser CurrentUserInfo caller, @RequestParam(defaultValue = "BUYER") ChatParty as) {
        return ApiResponse.ok(chatService.inbox(caller, as));
    }

    /** Oldest first; pass {@code before} = the seq of the first message shown to load older ones. */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{conversationId}")
    public ApiResponse<ChatThreadResponse> thread(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String conversationId,
            @RequestParam(required = false) Long before,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) int size) {
        return ApiResponse.ok(chatService.thread(caller, conversationId, before, size));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> send(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String conversationId,
            @Valid @RequestBody SendChatMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(chatService.send(caller, conversationId, request)));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{conversationId}/read")
    public ResponseEntity<Void> markRead(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String conversationId,
            @Valid @RequestBody MarkChatReadRequest request) {
        chatService.markRead(caller, conversationId, request);
        return ResponseEntity.noContent().build();
    }

    /** Call at most every few seconds while the person types; the other side shows "đang soạn tin…". */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{conversationId}/typing")
    public ResponseEntity<Void> typing(@CurrentUser CurrentUserInfo caller, @PathVariable String conversationId) {
        chatService.typing(caller, conversationId);
        return ResponseEntity.noContent().build();
    }
}
