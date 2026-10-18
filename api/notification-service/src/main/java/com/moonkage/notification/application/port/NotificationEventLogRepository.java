package com.moonkage.notification.application.port;

import com.moonkage.notification.domain.NotificationEventLog;
import java.util.Optional;

public interface NotificationEventLogRepository {

    Optional<NotificationEventLog> findById(String eventId);

    NotificationEventLog save(NotificationEventLog eventLog);
}
