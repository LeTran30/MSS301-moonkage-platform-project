package com.moonkage.identity.account.application;

import com.moonkage.identity.profile.IdNumberCheck;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * BR-27: vendor-service hashes the ID number a seller declared here, so the pepper never leaves identity-service
 * (D-07), and learns whether it is the number on the owner's verified card.
 */
@Service
@RequiredArgsConstructor
public class CheckAccountIdNumber {

    private final AccountQueries queries;
    private final ProfileApi profileApi;

    /** Throws NOT_FOUND of the account. */
    public IdNumberCheck handle(AccountId id, CitizenId declared) {
        queries.get(id);
        return profileApi.checkIdNumber(id, declared);
    }
}
