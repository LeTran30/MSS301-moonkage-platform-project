package com.moonkage.orchestrator.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.orchestrator.application.NotificationService;
import com.moonkage.orchestrator.contract.NotificationPageResponse;
import com.moonkage.orchestrator.contract.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The caller's notification inbox (NFR-10, AC-10.2).
 *
 * <p>The web had no way to read the notifications it received over STOMP: they arrived live and were lost on a
 * reload. This is the REST side of the same data (BE-04b).
 *
 * <p>{@code X-Account-Id} is set by the gateway from the access token; a request that does not come through the
 * gateway has no account and is refused.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    /** The header the gateway sets with the account id of the caller. */
    static final String ACCOUNT_ID_HEADER = "X-Account-Id";

    private final NotificationService notificationService;

    /** The caller's notifications, newest first. */
    @GetMapping
    public ApiResponse<NotificationPageResponse> list(
            @RequestHeader(ACCOUNT_ID_HEADER) String accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificationService.list(accountId, page, size));
    }

    /** Marks one notification of the caller as read. */
    @PostMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markRead(
            @RequestHeader(ACCOUNT_ID_HEADER) String accountId, @PathVariable String notificationId) {
        return ApiResponse.ok(notificationService.markRead(accountId, notificationId));
    }

    /** Marks every notification of the caller as read; answers how many were still unread. */
    @PostMapping("/read-all")
    public ApiResponse<Long> markAllRead(@RequestHeader(ACCOUNT_ID_HEADER) String accountId) {
        return ApiResponse.ok(notificationService.markAllRead(accountId));
    }
}
