package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RefreshTokenRequest;
import com.moonkage.identity.dto.request.RegisterAccountRequest;
import com.moonkage.identity.dto.request.ResetPasswordRequest;
import com.moonkage.identity.dto.request.SendOtpRequest;
import com.moonkage.identity.dto.request.VerifyAccountRequest;
import com.moonkage.identity.dto.response.ApiResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;
import com.moonkage.identity.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<RegisterAccountResponse>> register(
            @RequestBody @Valid RegisterAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(request.refreshToken())));
    }

    @PostMapping("/verify-account")
    public ResponseEntity<ApiResponse<RegisterAccountResponse>> verifyAccount(
            @RequestBody @Valid VerifyAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.verifyAccount(request)));
    }

    @PostMapping("/send-verify-account-otp")
    public ResponseEntity<ApiResponse<Void>> sendVerifyAccountOtp(@RequestBody @Valid SendOtpRequest request) {
        authService.sendVerifyAccountOtp(request.email());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        authService.resetPassword(request.email(), request.otp(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/send-reset-password-otp")
    public ResponseEntity<ApiResponse<Void>> sendResetPasswordOtp(@RequestBody @Valid SendOtpRequest request) {
        authService.sendResetPasswordOtp(request.email());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
