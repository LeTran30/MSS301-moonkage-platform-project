package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.account.dto.AccountCredentials;
import com.moonkage.identity.account.dto.AccountView;

/** Account → AccountView / response DTO. The only place that reads Account to build something other code sees. */
final class AccountMapper {

    private AccountMapper() {}

    static AccountView toView(Account account) {
        return new AccountView(
                account.getId(),
                account.getEmail().value(),
                phoneDigits(account),
                account.getRole(),
                account.isAccountVerified(),
                account.getPasswordChangedAt());
    }

    static AccountCredentials toCredentials(Account account) {
        return new AccountCredentials(toView(account), account.getPasswordHash());
    }

    /** The 9 subscriber digits, null when the account has no phone number. */
    private static String phoneDigits(Account account) {
        PhoneNumber phoneNumber = account.getPhoneNumber();
        return phoneNumber == null ? null : phoneNumber.value();
    }
}
