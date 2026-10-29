package com.moonkage.identity.profile;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.dto.AccountResponse;
import com.moonkage.identity.shared.PhoneNumber;

/** Profile data joined to what other code sees. */
final class UserProfileMapper {

    private UserProfileMapper() {}

    static AccountResponse toAccountResponse(AccountView account, String fullName) {
        return AccountResponse.builder()
                .accountId(account.id().toString())
                .email(account.email().value())
                .phoneNumber(phoneDigits(account.phoneNumber()))
                .fullName(fullName)
                .role(account.role())
                .build();
    }

    /** The 9 subscriber digits, null when the account has no phone number. */
    private static String phoneDigits(PhoneNumber phoneNumber) {
        return phoneNumber == null ? null : phoneNumber.value();
    }
}
