package com.moonkage.identity.nfc;

import java.time.Instant;

/** What the web and the app read about a session. */
public record NfcSessionView(NfcSessionId id, Instant expiresAt, NfcSessionStatus status) {}
