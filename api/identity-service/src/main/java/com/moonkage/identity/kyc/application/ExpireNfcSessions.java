package com.moonkage.identity.kyc.application;

import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Frees the memory of sessions and lockouts that have run out; reads already ignore them. */
@Service
@RequiredArgsConstructor
public class ExpireNfcSessions {

    private final NfcSessionStore sessions;
    private final KycAttemptStore attempts;
    private final Clock clock;

    public void handle() {
        Instant now = clock.instant();
        sessions.removeExpired(now);
        attempts.removeFinished(now);
    }
}
