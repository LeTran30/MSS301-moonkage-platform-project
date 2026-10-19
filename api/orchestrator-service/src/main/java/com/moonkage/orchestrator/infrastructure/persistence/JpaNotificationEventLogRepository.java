package com.moonkage.orchestrator.infrastructure.persistence;

import com.moonkage.orchestrator.application.port.NotificationEventLogRepository;
import com.moonkage.orchestrator.domain.NotificationEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaNotificationEventLogRepository
        extends JpaRepository<NotificationEventLog, String>, NotificationEventLogRepository {}
