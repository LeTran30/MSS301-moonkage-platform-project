package com.moonkage.identity.profile.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * GET /api/accounts/me: the account with the name it shows. Built here, not in account: the profile points to the
 * account, so profile depends on account and never the other way round.
 */
@Service
@RequiredArgsConstructor
public class GetMyAccount {

    private final AccountApi accountApi;
    private final ProfileQueries queries;

    /** Throws NOT_FOUND of the account, then of the profile. */
    @Transactional(readOnly = true)
    public MyAccount handle(AccountId id) {
        AccountView account =
                accountApi.find(id).orElseThrow(() -> new AppException(AccountError.NOT_FOUND, id.toString()));
        FullName fullName = queries.findFullName(id).orElseThrow(() -> new AppException(ProfileError.NOT_FOUND));
        return new MyAccount(account, fullName);
    }

    /** An account and the name its profile shows. */
    public record MyAccount(AccountView account, FullName fullName) {}
}
