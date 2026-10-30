package com.moonkage.identity.profile.application.port;

import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import java.util.Optional;

/** Where profiles are kept. A loaded profile is saved by its transaction; there is no {@code save}. */
public interface ProfileRepository {

    /** A new profile, whose id is its account's. */
    void add(Profile profile);

    Optional<Profile> find(AccountId id);

    /** Row lock until the transaction ends: two KYC completions of one account run one after the other. */
    Optional<Profile> findForUpdate(AccountId id);

    boolean isIdNumberTaken(IdNumberHash hash);

    /**
     * Writes pending changes now. Throws {@link IdNumberTakenMeanwhile} when another profile wrote the same ID number
     * since {@link #isIdNumberTaken} answered.
     */
    void flush();
}
