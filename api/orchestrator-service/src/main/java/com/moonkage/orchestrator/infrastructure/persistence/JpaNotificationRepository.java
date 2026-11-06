package com.moonkage.orchestrator.infrastructure.persistence;

import com.moonkage.orchestrator.application.port.NotificationRepository;
import com.moonkage.orchestrator.domain.Notification;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaNotificationRepository extends JpaRepository<Notification, String>, NotificationRepository {

    @Override
    Page<Notification> findByRecipientAccountIdOrderByCreatedAtDesc(String recipientAccountId, Pageable pageable);

    @Override
    long countByRecipientAccountIdAndReadFalse(String recipientAccountId);

    @Override
    Optional<Notification> findByIdAndRecipientAccountId(String id, String recipientAccountId);

    @Override
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read=true WHERE n.recipientAccountId=:accountId AND n.read=false")
    int markAllRead(@Param("accountId") String recipientAccountId);
}
