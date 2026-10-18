package com.moonkage.notification.infrastructure.persistence;

import com.moonkage.notification.application.port.NotificationEventLogRepository;
import com.moonkage.notification.domain.NotificationEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaNotificationEventLogRepository
        extends JpaRepository<NotificationEventLog, String>, NotificationEventLogRepository {}
