package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.AccountResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;
import com.moonkage.identity.dto.response.VerifyAccountResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.UserProfile;

/** Account → response DTOs. The only place that reads Account to build an API response (ArchUnit: dto ↛ entity). */
public final class AccountMapper {

    private AccountMapper() {}

    public static RegisterAccountResponse toRegisterResponse(Account account, boolean otpSent) {
        return RegisterAccountResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .verified(account.isAccountVerified())
                .otpSent(otpSent)
                .build();
    }

    public static VerifyAccountResponse toVerifyResponse(Account account) {
        return VerifyAccountResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .verified(account.isAccountVerified())
                .build();
    }

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

    public static AccountResponse toAccountResponse(Account account, UserProfile profile) {
        return AccountResponse.builder()
                .accountId(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(profile.getFullName())
                .role(account.getRole())
                .build();
    }
}
