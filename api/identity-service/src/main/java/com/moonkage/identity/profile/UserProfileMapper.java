package com.moonkage.identity.profile;

import com.moonkage.identity.account.dto.AccountResponse;
import com.moonkage.identity.account.dto.AccountView;

/** Profile data joined to what other code sees. */
final class UserProfileMapper {

    private UserProfileMapper() {}

    static AccountResponse toAccountResponse(AccountView account, String fullName) {
        return AccountResponse.builder()
                .accountId(account.id())
                .email(account.email())
                .phoneNumber(account.phoneNumber())
                .fullName(fullName)
                .role(account.role())
                .build();
    }
}
