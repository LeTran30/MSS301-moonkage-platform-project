package com.moonkage.orchestrator.contract;

import java.util.List;

/**
 * A page of notifications (NFR-10).
 *
 * @param content the notifications of this page, newest first
 * @param page the zero-based page number
 * @param size the page size
 * @param totalElements how many notifications the caller has in total
 * @param totalPages how many pages there are
 * @param unread how many of the caller's notifications are still unread
 */
public record NotificationPageResponse(
        List<NotificationResponse> content, int page, int size, long totalElements, int totalPages, long unread) {}
