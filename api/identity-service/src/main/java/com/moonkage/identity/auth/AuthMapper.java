package com.moonkage.identity.auth;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;
import com.moonkage.identity.shared.PhoneNumber;

/** AccountView → auth response DTOs. */
final class AuthMapper {

    private AuthMapper() {}

    static RegisterAccountResponse toRegisterResponse(AccountView account, boolean otpSent) {
        return RegisterAccountResponse.builder()
                .id(account.id().toString())
                .email(account.email().value())
                .phoneNumber(phoneDigits(account))
                .verified(account.verified())
                .otpSent(otpSent)
                .build();
    }

    static VerifyAccountResponse toVerifyResponse(AccountView account) {
        return VerifyAccountResponse.builder()
                .id(account.id().toString())
                .email(account.email().value())
                .phoneNumber(phoneDigits(account))
                .verified(account.verified())
                .build();
    }

    static LoginResponse toLoginResponse(AccountView account, String fullName, String token, String refreshToken) {
        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .accountId(account.id().toString())
                .email(account.email().value())
                .phoneNumber(phoneDigits(account))
                .fullName(fullName)
                .role(account.role())
                .build();
    }

    /** The 9 subscriber digits, as the API has always returned them; null when the account has no phone number. */
    static String phoneDigits(AccountView account) {
        PhoneNumber phoneNumber = account.phoneNumber();
        return phoneNumber == null ? null : phoneNumber.value();
    }
}
