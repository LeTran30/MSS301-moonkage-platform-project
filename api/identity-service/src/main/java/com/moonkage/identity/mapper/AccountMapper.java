package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.UserProfile;

/** Account → response DTOs. The only place that reads Account to build an API response (ArchUnit: dto ↛ entity). */
public final class AccountMapper {

    private AccountMapper() {}

    /** {@code otpSent} null for /verify, which sends no email. */
    public static RegisterAccountResponse toRegisterResponse(Account account, Boolean otpSent) {
        return RegisterAccountResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .verified(account.isAccountVerified())
                .otpSent(otpSent)
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
