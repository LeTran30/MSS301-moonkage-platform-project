package com.moonkage.identity.kyc.application;

import com.moonkage.identity.kyc.KycError;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.KycRules;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** AC-04.1: a new QR for the web. Only the newest one of an account works. */
@Service
@RequiredArgsConstructor
public class CreateNfcSession {

    private final ProfileApi profileApi;
    private final NfcSessionStore sessions;
    private final KycAttemptStore attempts;
    private final KycRules rules;
    private final Clock clock;

    /** Throws ALREADY_VERIFIED, or LOCKED with the minutes left. */
    public NfcSession handle(AccountId owner) {
        if (profileApi.findKyc(owner).isPresent()) {
            throw new AppException(KycError.ALREADY_VERIFIED);
        }
        Instant now = clock.instant();
        attempts.lockoutOf(owner).ensureNotLocked(now);
        NfcSession session = NfcSession.open(owner, now.plus(rules.sessionTtl()));
        sessions.replacePendingOf(session);
        return session;
    }
}
