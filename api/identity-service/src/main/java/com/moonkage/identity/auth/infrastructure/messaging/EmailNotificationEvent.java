package com.moonkage.identity.auth.infrastructure.messaging;

import java.util.Map;

/**
 * Envelope of an outbound email, published to RabbitMQ ({@code moonkage.events}). Mirrors the contract consumed by
 * orchestrator-service.
 */
public record EmailNotificationEvent(
        String eventId, String to, String subject, String templateCode, Map<String, Object> params) {

    /** Keys of {@code params}, the placeholders of the orchestrator-service OTP templates. */
    public static final String PARAM_NAME = "name";

    public static final String PARAM_OTP = "otp";
    public static final String PARAM_MINUTES = "minutes";
}
