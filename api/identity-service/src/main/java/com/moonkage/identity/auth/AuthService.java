package com.moonkage.identity.auth;

import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.VerifyAccountRequest;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;

/**
 * Public Port for the Authentication component.
 *
 * <p>Handles member registration, account activation, credential login, token refreshing, and password reset flows.
 */
public interface AuthService {

    RegisterAccountResponse register(RegisterAccountRequest request);

    VerifyAccountResponse verifyAccount(VerifyAccountRequest request);

    void sendVerifyAccountOtp(String email);

    LoginResponse login(LoginRequest request);

    LoginResponse refreshToken(String refreshToken);

    void sendResetPasswordOtp(String email);

    void resetPassword(String email, String otp, String newPassword);
}
