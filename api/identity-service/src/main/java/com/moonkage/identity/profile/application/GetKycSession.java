package com.moonkage.identity.profile.application;

import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.shared.AccountId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The web reads the result when it missed the push; the app checks the session before the tap. */
@Service
@RequiredArgsConstructor
class GetKycSession {

    private final NfcApi nfcApi;

    /** Throws SESSION_EXPIRED (unknown or expired) or SESSION_NOT_OWNED. */
    NfcSessionView handle(NfcSessionId id, AccountId caller) {
        return nfcApi.find(id, caller);
    }
}
