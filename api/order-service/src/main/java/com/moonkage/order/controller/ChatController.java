package com.moonkage.order.controller;

import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The chat of an order between its buyer and its vendor owner. Files go through POST /api/orders/uploads first, then
 * their tempKey rides on the message. New messages, reads and typing are pushed on STOMP /user/queue/chat.
 */
@RestController
@RequestMapping("/api/orders/{orderId}/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final String DEFAULT_PAGE_SIZE = "30";

    private final ChatService chatService;

    /** Oldest first; pass {@code before} = the seq of the first message shown to load older ones. */
    @GetMapping
    public ApiResponse<ChatThreadResponse> thread(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @RequestParam(required = false) Long before,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) int size) {
        return ApiResponse.ok(chatService.thread(caller, orderId, before, size));
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatMessageResponse> send(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody SendChatMessageRequest request) {
        return ApiResponse.created(chatService.send(caller, orderId, request));
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markRead(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody MarkChatReadRequest request) {
        chatService.markRead(caller, orderId, request);
        return ResponseEntity.noContent().build();
    }

    /** Call at most every few seconds while the person types; the other side shows "đang soạn tin…". */
    @PostMapping("/typing")
    public ResponseEntity<Void> typing(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        chatService.typing(caller, orderId);
        return ResponseEntity.noContent().build();
    }
}
