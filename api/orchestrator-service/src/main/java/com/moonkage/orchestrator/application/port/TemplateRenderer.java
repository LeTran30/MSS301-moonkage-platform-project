package com.moonkage.orchestrator.application.port;

import java.util.Map;

public interface TemplateRenderer {

    String render(String templateCode, Map<String, Object> params);
}
