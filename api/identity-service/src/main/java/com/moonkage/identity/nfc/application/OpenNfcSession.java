package com.moonkage.identity.nfc.application;

import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.nfc.domain.NfcSession;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** AC-04.1: a new QR for the web. Only the newest one of an account works. */
@Service
@RequiredArgsConstructor
class OpenNfcSession {

    private final NfcSessionStore sessions;
    private final NfcAttemptStore attempts;
    private final NfcRules rules;
    private final Clock clock;

    /** Throws LOCKED with the minutes left. */
    NfcSession handle(AccountId owner) {
        Instant now = clock.instant();
        attempts.lockoutOf(owner).ensureNotLocked(now);
        NfcSession session = NfcSession.open(owner, now.plus(rules.sessionTtl()));
        sessions.replacePendingOf(session);
        return session;
    }
}
