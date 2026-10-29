package com.moonkage.identity.profile.application;

import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.KycCompletion;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The module's one door for other modules: each call goes to its use case or to the queries. */
@Service
@RequiredArgsConstructor
class ProfileFacade implements ProfileApi {

    private final ProfileQueries queries;
    private final CreateProfile createProfile;
    private final CompleteKyc completeKyc;

    @Override
    public void create(AccountId id, FullName fullName) {
        createProfile.handle(id, fullName);
    }

    @Override
    public Optional<FullName> findFullName(AccountId id) {
        return queries.findFullName(id);
    }

    @Override
    public Optional<LegalIdentity> findKyc(AccountId id) {
        return queries.findKyc(id);
    }

    @Override
    public KycCompletion completeKyc(AccountId id, LegalIdentity identity) {
        return completeKyc.handle(id, identity);
    }
}
