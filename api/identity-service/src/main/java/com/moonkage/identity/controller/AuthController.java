package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.AccountCreateRequest;
import com.moonkage.identity.dto.request.ForgotPasswordRequest;
import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RefreshTokenRequest;
import com.moonkage.identity.dto.request.ResetPasswordRequest;
import com.moonkage.identity.dto.request.VerifyRequest;
import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import com.moonkage.identity.service.AuthService;
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
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AccountCreateResponse> register(@RequestBody @Valid AccountCreateRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<AccountCreateResponse> verifyAccount(@RequestBody @Valid VerifyRequest request) {
        return ResponseEntity.ok(authService.verifyAccount(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Void> resendOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        authService.resendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getMyProfile(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(authService.getMyProfile(currentUser.getAccountId()));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Void> forgotPasswordSendOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        authService.forgotPasswordSendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Void> forgotPasswordReset(@RequestBody @Valid ResetPasswordRequest request) {
        authService.forgotPasswordReset(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
