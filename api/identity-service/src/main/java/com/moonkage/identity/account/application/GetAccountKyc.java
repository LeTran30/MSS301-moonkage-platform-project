package com.moonkage.identity.account.application;

import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileKyc;
import com.moonkage.identity.shared.AccountId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Whether an account passed KYC, for itself and for other services (BR-23, AC-45.1). Masked data only. */
@Service
@RequiredArgsConstructor
public class GetAccountKyc {

    private final AccountQueries queries;
    private final ProfileApi profileApi;

    /** Throws NOT_FOUND of the account. */
    public ProfileKyc handle(AccountId id) {
        queries.get(id);
        return profileApi.findKyc(id);
    }
}
