package com.moonkage.identity.kyc.application;

import com.moonkage.identity.kyc.KycError;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The web reads the result when it missed the push; the app checks the session before the tap. */
@Service
@RequiredArgsConstructor
public class GetNfcSession {

    private final NfcSessionStore sessions;
    private final Clock clock;

    /** Throws SESSION_EXPIRED (unknown or expired) or SESSION_NOT_OWNED. */
    public NfcSession handle(NfcSessionId id, AccountId caller) {
        NfcSession session = sessions.find(id)
                .filter(found -> !found.isExpired(clock.instant()))
                .orElseThrow(() -> new AppException(KycError.SESSION_EXPIRED));
        if (!session.owner().equals(caller)) {
            throw new AppException(KycError.SESSION_NOT_OWNED);
        }
        return session;
    }
}
