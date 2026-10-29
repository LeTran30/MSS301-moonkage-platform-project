package com.moonkage.identity.kyc.infrastructure.memory;

import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.UnaryOperator;
import org.springframework.stereotype.Component;

/**
 * Sessions in this process's memory (Requirement 7.1 NfcSession): no rows to clean up, and a restart only means the
 * user scans a new QR. One pending session per account bounds the memory.
 */
@Component
class InMemoryNfcSessionStore implements NfcSessionStore {

    private final Map<NfcSessionId, NfcSession> sessions = new ConcurrentHashMap<>();

    /**
     * Synchronized so two parallel creates cannot both survive (Q-24): remove-then-put is not atomic on its own.
     * Creates are rare, and card checks do not take this lock.
     */
    @Override
    public synchronized void replacePendingOf(NfcSession session) {
        sessions.values().removeIf(kept -> kept.owner().equals(session.owner()) && kept.isPending());
        sessions.put(session.id(), session);
    }

    @Override
    public Optional<NfcSession> find(NfcSessionId id) {
        return Optional.ofNullable(sessions.get(id));
    }

    @Override
    public void update(NfcSessionId id, UnaryOperator<NfcSession> change) {
        sessions.computeIfPresent(id, (key, session) -> change.apply(session));
    }

    /** removeIf goes through the map's own conditional remove, so it never drops a concurrent update. */
    @Override
    public void removeExpired(Instant now) {
        sessions.values().removeIf(session -> session.isExpired(now) && !session.inFlight());
    }
}
