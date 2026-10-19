package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RegisterAccountRequest;
import com.moonkage.identity.dto.request.VerifyAccountRequest;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;

public interface AuthService {

    RegisterAccountResponse register(RegisterAccountRequest request);

    RegisterAccountResponse verifyAccount(VerifyAccountRequest request);

    void sendVerifyAccountOtp(String email);

    LoginResponse login(LoginRequest request);

    LoginResponse refreshToken(String refreshToken);

    LoginResponse getMyProfile(String accountId);

    void sendResetPasswordOtp(String email);

    void resetPassword(String email, String otp, String newPassword);
}
