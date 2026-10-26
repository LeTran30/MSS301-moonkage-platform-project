package com.moonkage.identity.account;

/** Account → AccountView / response DTO. The only place that reads Account to build something other code sees. */
final class AccountMapper {

    private AccountMapper() {}

    static AccountView toView(Account account) {
        return new AccountView(
                account.getId(),
                account.getEmail(),
                account.getPhoneNumber(),
                account.getRole(),
                account.isAccountVerified(),
                account.getPasswordChangedAt());
    }

    static AccountCredentials toCredentials(Account account) {
        return new AccountCredentials(toView(account), account.passwordHash());
    }

    static AccountResponse toAccountResponse(Account account, String fullName) {
        return AccountResponse.builder()
                .accountId(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(fullName)
                .role(account.getRole())
                .build();
    }
}
