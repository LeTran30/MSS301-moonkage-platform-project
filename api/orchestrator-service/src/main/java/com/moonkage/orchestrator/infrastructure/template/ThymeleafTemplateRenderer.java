package com.moonkage.orchestrator.infrastructure.template;

import com.moonkage.orchestrator.application.port.TemplateRenderer;
import com.moonkage.orchestrator.domain.TemplateRenderException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateEngineException;

/**
 * Thymeleaf-based implementation of TemplateRenderer.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ThymeleafTemplateRenderer implements TemplateRenderer {

    private final TemplateEngine templateEngine;

    @Override
    public String render(String templateCode, Map<String, Object> params) {
        try {
            Context context = new Context();
            if (params != null) {
                context.setVariables(params);
            }
            return templateEngine.process(templateCode, context);
        } catch (TemplateEngineException e) {
            log.error("Failed to render Thymeleaf template '{}': {}", templateCode, e.getMessage());
            throw new TemplateRenderException("Template rendering failed for '" + templateCode + "'", e);
        }
    }
}
