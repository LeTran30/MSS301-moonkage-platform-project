package com.moonkage.notification.application.port;

import com.moonkage.notification.domain.Notification;

public interface NotificationRepository {

    Notification save(Notification notification);
}
