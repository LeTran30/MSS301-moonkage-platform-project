package com.moonkage.identity.nfc.application;

import com.moonkage.identity.nfc.NfcError;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import com.moonkage.identity.nfc.domain.NfcSession;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The web reads the result when it missed the push; the app checks the session before the tap. */
@Service
@RequiredArgsConstructor
class FindNfcSession {

    private final NfcSessionStore sessions;
    private final Clock clock;

    /** Throws SESSION_EXPIRED (unknown or expired) or SESSION_NOT_OWNED. */
    NfcSession handle(NfcSessionId id, AccountId caller) {
        NfcSession session = sessions.find(id)
                .filter(found -> !found.isExpired(clock.instant()))
                .orElseThrow(() -> new AppException(NfcError.SESSION_EXPIRED));
        if (!session.owner().equals(caller)) {
            throw new AppException(NfcError.SESSION_NOT_OWNED);
        }
        return session;
    }
}
