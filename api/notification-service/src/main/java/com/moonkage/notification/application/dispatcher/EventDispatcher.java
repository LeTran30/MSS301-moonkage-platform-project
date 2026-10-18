package com.moonkage.notification.application.dispatcher;

import com.moonkage.notification.contract.BaseEvent;

public interface EventDispatcher {

    void dispatch(BaseEvent event);
}
