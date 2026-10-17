package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.AccountCreateRequest;
import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.VerifyRequest;
import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.LoginResponse;

public interface AuthService {

    AccountCreateResponse register(AccountCreateRequest request);

    AccountCreateResponse verifyAccount(VerifyRequest request);

    void resendOtp(String email);

    LoginResponse login(LoginRequest request);

    LoginResponse refreshToken(String refreshToken);

    LoginResponse getMyProfile(String accountId);

    void forgotPasswordSendOtp(String email);

    void forgotPasswordReset(String email, String otp, String newPassword);
}
