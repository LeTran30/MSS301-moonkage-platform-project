package com.moonkage.identity.nfc.application;

import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Frees the memory of sessions and lockouts that have run out; reads already ignore them. */
@Service
@RequiredArgsConstructor
public class ExpireNfcSessions {

    private final NfcSessionStore sessions;
    private final NfcAttemptStore attempts;
    private final Clock clock;

    public void handle() {
        Instant now = clock.instant();
        sessions.removeExpired(now);
        attempts.removeFinished(now);
    }
}
