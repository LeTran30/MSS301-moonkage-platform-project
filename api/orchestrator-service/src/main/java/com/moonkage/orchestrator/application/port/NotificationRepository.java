package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.domain.Notification;

public interface NotificationRepository {

    Notification save(Notification notification);
}
