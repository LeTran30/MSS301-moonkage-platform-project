package com.moonkage.notification.application.port;

import com.moonkage.notification.contract.BaseEvent;
import com.moonkage.notification.contract.EventType;

/**
 * Port implemented by each notification channel (email, inapp, audit).
 *
 * @param <E> concrete event type handled by the channel
 */
public interface EventHandler<E extends BaseEvent> {

    EventType supports();

    void handle(E event);
}
