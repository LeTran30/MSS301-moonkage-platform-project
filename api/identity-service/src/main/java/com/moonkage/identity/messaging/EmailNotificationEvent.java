package com.moonkage.identity.messaging;

import java.util.Map;

/**
 * Envelope for outbound email notification events published to RabbitMQ (`moonkage.events`).
 *
 * <p>Mirrors the contract consumed by `notification-service`.
 */
public record EmailNotificationEvent(
        String eventId, String to, String subject, String templateCode, Map<String, Object> params) {

    /** Keys of {@code params}, the placeholders of the notification-service OTP templates. */
    public static final String PARAM_NAME = "name";

    public static final String PARAM_OTP = "otp";
    public static final String PARAM_MINUTES = "minutes";
}
