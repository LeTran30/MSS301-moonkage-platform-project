package com.moonkage.identity.nfc.application.port;

import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.domain.NfcSession;
import java.time.Instant;
import java.util.Optional;
import java.util.function.UnaryOperator;

/** Where NFC sessions live while they last (plan v2, 6.3). They are never stored in the database. */
public interface NfcSessionStore {

    /** Keeps {@code session} and drops every other PENDING session of its owner: only the newest QR works. */
    void replacePendingOf(NfcSession session);

    /** The session as kept, expired or not. */
    Optional<NfcSession> find(NfcSessionId id);

    /**
     * Atomically replaces the session with what {@code change} returns. Nothing happens when there is no such session.
     */
    void update(NfcSessionId id, UnaryOperator<NfcSession> change);

    /** Drops expired sessions no card is being checked in. */
    void removeExpired(Instant now);
}
