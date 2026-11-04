package com.moonkage.orchestrator.application;

import com.moonkage.orchestrator.application.port.NotificationRepository;
import com.moonkage.orchestrator.contract.NotificationPageResponse;
import com.moonkage.orchestrator.contract.NotificationResponse;
import com.moonkage.orchestrator.domain.Notification;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The caller's notification inbox (NFR-10).
 *
 * <p>The notifications themselves arrive over RabbitMQ
 * ({@link com.moonkage.orchestrator.channel.inapp.InAppEventHandler}); this service only reads them back for the web,
 * which had no REST endpoint for them until now (BE-04b).
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationRepository notificationRepository;

    /**
     * One page of the caller's notifications, newest first.
     *
     * @param accountId the caller, taken from the gateway's X-Account-Id header
     * @param page zero-based page number
     * @param size page size, at most 100
     */
    @Transactional(readOnly = true)
    public NotificationPageResponse list(String accountId, int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page must not be negative");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> found =
                notificationRepository.findByRecipientAccountIdOrderByCreatedAtDesc(accountId, pageable);
        List<NotificationResponse> content =
                found.getContent().stream().map(NotificationService::toResponse).toList();
        long unread = notificationRepository.countByRecipientAccountIdAndReadFalse(accountId);
        return new NotificationPageResponse(
                content, page, size, found.getTotalElements(), found.getTotalPages(), unread);
    }

    /**
     * Marks one of the caller's notifications as read.
     *
     * <p>Marking an already read notification again changes nothing, so the web may repeat the call freely.
     *
     * @param accountId the caller
     * @param notificationId the notification to mark
     * @return the notification after the change
     */
    @Transactional
    public NotificationResponse markRead(String accountId, String notificationId) {
        Notification notification = notificationRepository
                .findByIdAndRecipientAccountId(notificationId, accountId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    /** Marks every notification of the caller as read; answers how many were still unread. */
    @Transactional
    public long markAllRead(String accountId) {
        return notificationRepository.markAllRead(accountId);
    }

    private static NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getContent(),
                notification.getTargetUrl(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}
