package com.moonkage.identity.auth;

import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;

/** AccountView → auth response DTOs. */
final class AuthMapper {

    private AuthMapper() {}

    static RegisterAccountResponse toRegisterResponse(AccountView account, boolean otpSent) {
        return RegisterAccountResponse.builder()
                .id(account.id())
                .email(account.email())
                .phoneNumber(account.phoneNumber())
                .verified(account.verified())
                .otpSent(otpSent)
                .build();
    }

    static VerifyAccountResponse toVerifyResponse(AccountView account) {
        return VerifyAccountResponse.builder()
                .id(account.id())
                .email(account.email())
                .phoneNumber(account.phoneNumber())
                .verified(account.verified())
                .build();
    }

    static LoginResponse toLoginResponse(AccountView account, String fullName, String token, String refreshToken) {
        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .accountId(account.id())
                .email(account.email())
                .phoneNumber(account.phoneNumber())
                .fullName(fullName)
                .role(account.role())
                .build();
    }
}
