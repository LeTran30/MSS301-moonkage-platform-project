package com.moonkage.identity.web;

import com.moonkage.identity.auth.AuthService;
import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RefreshTokenRequest;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.ResetPasswordRequest;
import com.moonkage.identity.auth.dto.SendOtpRequest;
import com.moonkage.identity.auth.dto.VerifyAccountRequest;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;
import com.moonkage.identity.platform.web.ApiResponse;
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
    public ResponseEntity<ApiResponse<VerifyAccountResponse>> verifyAccount(
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
