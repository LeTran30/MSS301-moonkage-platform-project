package com.moonkage.identity.profile.application;

import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.application.port.ProfileRepository;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-01: the profile of a new account, in the registration's transaction. */
@Service
@RequiredArgsConstructor
class CreateProfile {

    private final ProfileRepository profiles;

    @Transactional
    void handle(AccountId id, FullName fullName) {
        profiles.add(Profile.create(id, fullName));
    }
}
