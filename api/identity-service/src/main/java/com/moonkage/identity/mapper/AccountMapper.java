package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.UserProfile;

/** Account → response DTOs. The only place that reads Account to build an API response (ArchUnit: dto ↛ entity). */
public final class AccountMapper {

    private AccountMapper() {}

    public static AccountCreateResponse toCreateResponse(Account account) {
        return AccountCreateResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .verified(account.isAccountVerified())
                .build();
    }

    /** {@code token} / {@code refreshToken} null for GET /me, which returns no new tokens. */
    public static LoginResponse toLoginResponse(
            Account account, UserProfile profile, String token, String refreshToken) {
        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .accountId(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(profile.getFullName())
                .role(account.getRole())
                .build();
    }
}
