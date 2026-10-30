package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * GET /api/accounts/me: the account with the name its profile shows. The profile is a resource of the account, so
 * account asks profile and never the other way round.
 */
@Service
@RequiredArgsConstructor
public class GetMyAccount {

    private final AccountQueries queries;
    private final ProfileApi profileApi;

    /** Throws NOT_FOUND of the account, then of the profile. */
    @Transactional(readOnly = true)
    public MyAccount handle(AccountId id) {
        AccountView account = queries.get(id);
        FullName fullName = profileApi.findFullName(id).orElseThrow(() -> new AppException(ProfileError.NOT_FOUND));
        return new MyAccount(account, fullName);
    }

    /** An account and the name its profile shows. */
    public record MyAccount(AccountView account, FullName fullName) {}
}
