package com.moonkage.identity.profile;

import com.moonkage.identity.shared.AccountId;
import java.util.Optional;

/**
 * What other modules may ask of the profile module (plan v2, 4.3): who a person is, by the name they chose and, after
 * KYC, by law. A profile shares its account's id. Commands join the caller's transaction.
 */
public interface ProfileApi {

    /** FR-01: the profile of a new account. */
    void create(AccountId id, FullName fullName);

    Optional<FullName> findFullName(AccountId id);

    /** Empty while the account has not passed KYC (or has no profile). */
    Optional<LegalIdentity> findKyc(AccountId id);

    /**
     * FR-04: the card passed every check. Throws NOT_FOUND without a profile, and {@link IdNumberTakenMeanwhile} when
     * a parallel KYC wrote the same number first.
     */
    KycCompletion completeKyc(AccountId id, LegalIdentity identity);
}
