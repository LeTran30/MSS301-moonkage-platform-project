package com.moonkage.identity.profile;

import java.util.Optional;

/** Public API of the profile component: what a person shows inside the platform (FR-01). */
public interface UserProfileService {

    /** The profile shares the account's id; joins the caller's transaction. */
    void createProfile(String accountId, String fullName);

    /** Throws USER_PROFILE_NOT_FOUND. */
    String getFullName(String accountId);

    Optional<String> findFullName(String accountId);
}
