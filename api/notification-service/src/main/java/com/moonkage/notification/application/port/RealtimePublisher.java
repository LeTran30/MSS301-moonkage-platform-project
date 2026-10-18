package com.moonkage.notification.application.port;

import com.moonkage.notification.domain.Notification;

public interface RealtimePublisher {

    void publishToUser(String accountId, Notification notification);
}
