package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RegisterAccountRequest;
import com.moonkage.identity.dto.request.VerifyAccountRequest;
import com.moonkage.identity.dto.response.AccountResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;
import com.moonkage.identity.dto.response.VerifyAccountResponse;

public interface AuthService {

    RegisterAccountResponse register(RegisterAccountRequest request);

    VerifyAccountResponse verifyAccount(VerifyAccountRequest request);

    void sendVerifyAccountOtp(String email);

    LoginResponse login(LoginRequest request);

    LoginResponse refreshToken(String refreshToken);

    AccountResponse getMyAccount(String accountId);

    void sendResetPasswordOtp(String email);

    void resetPassword(String email, String otp, String newPassword);
}
