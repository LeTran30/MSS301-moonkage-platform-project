package com.bake2b.identity.service;

import com.bake2b.identity.dto.request.AccountCreateRequest;
import com.bake2b.identity.dto.request.LoginRequest;
import com.bake2b.identity.dto.request.VerifyRequest;
import com.bake2b.identity.dto.response.AccountCreateResponse;
import com.bake2b.identity.dto.response.LoginResponse;

public interface AuthenticationService {

    AccountCreateResponse register(AccountCreateRequest request);

    AccountCreateResponse verifyAccount(VerifyRequest request);

    void resendOtp(String email);

    LoginResponse login(LoginRequest request);

    LoginResponse refreshToken(String refreshToken);

    LoginResponse getMyProfile(String accountId);

    void forgotPasswordSendOtp(String email);

    void forgotPasswordReset(String email, String otp, String newPassword);
}
