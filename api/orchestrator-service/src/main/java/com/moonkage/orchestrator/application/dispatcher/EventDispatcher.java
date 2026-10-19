package com.moonkage.orchestrator.application.dispatcher;

import com.moonkage.orchestrator.contract.BaseEvent;

public interface EventDispatcher {

    void dispatch(BaseEvent event);
}
