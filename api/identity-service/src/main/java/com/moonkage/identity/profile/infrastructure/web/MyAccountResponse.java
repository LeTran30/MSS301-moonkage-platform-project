package com.moonkage.identity.profile.infrastructure.web;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.application.GetMyAccount.MyAccount;
import com.moonkage.identity.shared.Role;

/**
 * GET /api/accounts/me.
 *
 * @param phoneNumber the 9 subscriber digits, null when the account has none
 */
public record MyAccountResponse(String accountId, String email, String phoneNumber, String fullName, Role role) {

    static MyAccountResponse from(MyAccount myAccount) {
        AccountView account = myAccount.account();
        return new MyAccountResponse(
                account.id().toString(),
                account.email().value(),
                account.phoneNumber() == null ? null : account.phoneNumber().value(),
                myAccount.fullName().value(),
                account.role());
    }
}
