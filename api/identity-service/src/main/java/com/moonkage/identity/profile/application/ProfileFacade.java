package com.moonkage.identity.profile.application;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.IdNumberCheck;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileKyc;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The module's one door for other modules: each call goes to its use case or to the queries. */
@Service
@RequiredArgsConstructor
class ProfileFacade implements ProfileApi {

    private final ProfileQueries queries;
    private final CreateProfile createProfile;
    private final GetKycStatus getKycStatus;
    private final StartKycSession startKycSession;
    private final GetKycSession getKycSession;
    private final SubmitKycCard submitKycCard;
    private final CheckIdNumber checkIdNumber;

    @Override
    public void create(AccountId id, FullName fullName) {
        createProfile.handle(id, fullName);
    }

    @Override
    public Optional<FullName> findFullName(AccountId id) {
        return queries.findFullName(id);
    }

    @Override
    public ProfileKyc findKyc(AccountId id) {
        return getKycStatus.handle(id);
    }

    @Override
    public NfcSessionView startKyc(AccountId owner) {
        return startKycSession.handle(owner);
    }

    @Override
    public NfcSessionView findKycSession(NfcSessionId id, AccountId caller) {
        return getKycSession.handle(id, caller);
    }

    @Override
    public CardCheck submitKycCard(NfcSessionId session, AccountId owner, SubmittedCard card) {
        return submitKycCard.handle(session, owner, card);
    }

    @Override
    public IdNumberCheck checkIdNumber(AccountId id, CitizenId declared) {
        return checkIdNumber.handle(id, declared);
    }
}
