package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.AccountCreateRequest;
import com.moonkage.identity.dto.request.EmailRequest;
import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RefreshTokenRequest;
import com.moonkage.identity.dto.request.ResetPasswordRequest;
import com.moonkage.identity.dto.request.VerifyRequest;
import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<AccountCreateResponse>> register(
            @RequestBody @Valid AccountCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.register(request)));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<AccountCreateResponse>> verifyAccount(@RequestBody @Valid VerifyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.verifyAccount(request)));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@RequestBody @Valid EmailRequest request) {
        authService.resendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(request.getRefreshToken())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyProfile(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getMyProfile(currentUser.accountId())));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordSendOtp(@RequestBody @Valid EmailRequest request) {
        authService.forgotPasswordSendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordReset(@RequestBody @Valid ResetPasswordRequest request) {
        authService.forgotPasswordReset(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
