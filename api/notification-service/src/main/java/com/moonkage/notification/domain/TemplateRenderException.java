package com.moonkage.notification.domain;

/**
 * Thrown when an email or notification template cannot be resolved or rendered.
 */
public class TemplateRenderException extends RuntimeException {

    public TemplateRenderException(String message, Throwable cause) {
        super(message, cause);
    }
}
