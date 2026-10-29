package com.moonkage.identity.profile.application;

import com.moonkage.identity.profile.KycCompletion;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.profile.application.port.ProfileRepository;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-04: the legal identity a card proved. The profile row is locked, so two cards of one account cannot both pass;
 * the unique key on the number stops two accounts that check the same card at the same instant (BR-23).
 */
@Service
@RequiredArgsConstructor
class CompleteKyc {

    private final ProfileRepository profiles;

    /** Throws NOT_FOUND without a profile. */
    @Transactional
    KycCompletion handle(AccountId id, LegalIdentity identity) {
        Profile profile = profiles.findForUpdate(id).orElseThrow(() -> new AppException(ProfileError.NOT_FOUND));
        if (profile.isKycVerified()) {
            return KycCompletion.ALREADY_COMPLETED;
        }
        if (profiles.isIdNumberTaken(identity.idNumberHash())) {
            return KycCompletion.ID_NUMBER_TAKEN;
        }
        profile.completeKyc(identity);
        profiles.flush();
        return KycCompletion.COMPLETED;
    }
}
