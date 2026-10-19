package com.moonkage.orchestrator.application.port;

/**
 * Per-account STOMP destinations. A browser subscribes to {@code /user} + one of these (e.g.
 * {@code /user/queue/nfc}) and only receives what was sent to its own account.
 */
public final class RealtimeDestination {

    /** Prefix of every destination a client may subscribe to. */
    public static final String USER_PREFIX = "/user";

    public static final String QUEUE_PREFIX = "/queue";

    public static final String NOTIFICATIONS = QUEUE_PREFIX + "/notifications";

    /** Result of each NFC card attempt, matched by the web to the QR it shows (AC-04.5). */
    public static final String NFC = QUEUE_PREFIX + "/nfc";

    private RealtimeDestination() {}
}
