package com.bake2b.identity.controller;

import com.bake2b.identity.common.CurrentUserInfo;
import com.bake2b.identity.config.CurrentUser;
import com.bake2b.identity.dto.request.AccountCreateRequest;
import com.bake2b.identity.dto.request.ForgotPasswordRequest;
import com.bake2b.identity.dto.request.LoginRequest;
import com.bake2b.identity.dto.request.RefreshTokenRequest;
import com.bake2b.identity.dto.request.ResetPasswordRequest;
import com.bake2b.identity.dto.request.VerifyRequest;
import com.bake2b.identity.dto.response.AccountCreateResponse;
import com.bake2b.identity.dto.response.LoginResponse;
import com.bake2b.identity.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<AccountCreateResponse> register(@RequestBody @Valid AccountCreateRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<AccountCreateResponse> verifyAccount(@RequestBody @Valid VerifyRequest request) {
        return ResponseEntity.ok(authenticationService.verifyAccount(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Void> resendOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        authenticationService.resendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(authenticationService.refreshToken(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getMyProfile(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(authenticationService.getMyProfile(currentUser.getAccountId()));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Void> forgotPasswordSendOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        authenticationService.forgotPasswordSendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Void> forgotPasswordReset(@RequestBody @Valid ResetPasswordRequest request) {
        authenticationService.forgotPasswordReset(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
