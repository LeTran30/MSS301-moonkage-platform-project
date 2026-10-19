package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.domain.Notification;

/** Pushes to the browsers of one account; an account with no open page simply misses the push. */
public interface RealtimePublisher {

    /** In-app notification, to {@link RealtimeDestination#NOTIFICATIONS}. */
    void publishToUser(String accountId, Notification notification);

    /** Any payload to one of the {@link RealtimeDestination}s of the account. */
    void publishToUser(String accountId, String destination, Object payload);
}
