package com.moonkage.identity.profile;

import com.moonkage.identity.account.dto.AccountResponse;
import java.util.Optional;

/** Public API of the profile component: what a person shows inside the platform (FR-01). */
public interface UserProfileService {

    /**
     * GET /api/accounts/me: the account with the name it shows. Built here, not in account: the profile points to the
     * account, so profile depends on account and never the other way round. Throws ACCOUNT_NOT_FOUND.
     */
    AccountResponse getMyAccount(String accountId);

    /** The profile shares the account's id; joins the caller's transaction. */
    void createProfile(String accountId, String fullName);

    /** Throws USER_PROFILE_NOT_FOUND. */
    String getFullName(String accountId);

    Optional<String> findFullName(String accountId);
}
