package com.moonkage.identity.nfc.application;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.CardVerdict;
import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The module's one door for other modules: each call goes to its use case. */
@Service
@RequiredArgsConstructor
class NfcFacade implements NfcApi {

    private final OpenNfcSession openNfcSession;
    private final FindNfcSession findNfcSession;
    private final CheckNfcCard checkNfcCard;
    private final NfcAttemptStore attempts;
    private final Clock clock;

    @Override
    public NfcSessionView open(AccountId owner) {
        return openNfcSession.handle(owner).view();
    }

    @Override
    public NfcSessionView find(NfcSessionId id, AccountId caller) {
        return findNfcSession.handle(id, caller).view();
    }

    @Override
    public boolean isLocked(AccountId owner) {
        return attempts.lockoutOf(owner).isLocked(clock.instant());
    }

    @Override
    public CardCheck check(NfcSessionId id, AccountId caller, SubmittedCard card, CardVerdict verdict) {
        return checkNfcCard.handle(id, caller, card, verdict);
    }
}
