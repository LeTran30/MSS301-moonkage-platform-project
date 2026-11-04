package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.domain.Notification;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationRepository {

    Notification save(Notification notification);

    /**
     * The caller's notifications, newest first, one page (NFR-10).
     *
     * @param recipientAccountId the account whose inbox is read
     * @param pageable the page to read
     */
    Page<Notification> findByRecipientAccountIdOrderByCreatedAtDesc(String recipientAccountId, Pageable pageable);

    /** How many of the caller's notifications are still unread (the badge of the bell). */
    long countByRecipientAccountIdAndReadFalse(String recipientAccountId);

    /** One of the caller's notifications; empty when it belongs to somebody else. */
    Optional<Notification> findByIdAndRecipientAccountId(String id, String recipientAccountId);

    /** Marks every unread notification of the caller as read; answers how many rows changed. */
    int markAllRead(String recipientAccountId);
}
