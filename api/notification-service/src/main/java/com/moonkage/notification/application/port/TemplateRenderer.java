package com.moonkage.notification.application.port;

import java.util.Map;

public interface TemplateRenderer {

    String render(String templateCode, Map<String, Object> params);
}
