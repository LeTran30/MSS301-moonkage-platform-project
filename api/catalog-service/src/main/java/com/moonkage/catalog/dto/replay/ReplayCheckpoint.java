package com.moonkage.catalog.dto.replay;

import java.time.Instant;

/** Ephemeral local scan position only; NOT a durable producer/feed checkpoint. Restart each recovery run at null. */
public record ReplayCheckpoint(Instant receivedAt, String eventId) {
    private static final int MAX_ID_LENGTH = 64;

    public ReplayCheckpoint {
        if (receivedAt == null || eventId == null || eventId.isBlank() || eventId.length() > MAX_ID_LENGTH) {
            throw new IllegalArgumentException("Invalid inbox scan checkpoint");
        }
    }
}
