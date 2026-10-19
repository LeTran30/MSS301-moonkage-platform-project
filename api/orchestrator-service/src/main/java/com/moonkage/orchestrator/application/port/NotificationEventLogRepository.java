package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.domain.NotificationEventLog;
import java.util.Optional;

public interface NotificationEventLogRepository {

    Optional<NotificationEventLog> findById(String eventId);

    NotificationEventLog save(NotificationEventLog eventLog);
}
