package com.moonkage.identity.profile.application;

import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.application.port.ProfileRepository;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Reads of the profile module. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ProfileQueries {

    private final ProfileRepository profiles;

    Optional<FullName> findFullName(AccountId id) {
        return profiles.find(id).map(Profile::fullName);
    }

    Optional<LegalIdentity> findKyc(AccountId id) {
        return profiles.find(id).flatMap(Profile::legalIdentity);
    }
}
