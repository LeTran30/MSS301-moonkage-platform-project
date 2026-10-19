package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.contract.BaseEvent;
import com.moonkage.orchestrator.contract.EventType;

/**
 * Port implemented by each notification channel (email, inapp, audit).
 *
 * @param <E> concrete event type handled by the channel
 */
public interface EventHandler<E extends BaseEvent> {

    EventType supports();

    void handle(E event);
}
