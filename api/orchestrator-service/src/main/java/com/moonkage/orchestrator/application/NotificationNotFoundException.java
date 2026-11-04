package com.moonkage.orchestrator.application;

/**
 * The notification does not exist, or it belongs to another account.
 *
 * <p>Both answers are the same on purpose: a caller must not learn that an id exists in somebody else's inbox.
 */
public class NotificationNotFoundException extends RuntimeException {

    public NotificationNotFoundException(String notificationId) {
        super("Notification not found: " + notificationId);
    }
}
