package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.auth.application.Login;
import com.moonkage.identity.auth.application.RefreshSession;
import com.moonkage.identity.auth.application.RegisterAccount;
import com.moonkage.identity.auth.application.ResendVerifyOtp;
import com.moonkage.identity.auth.application.ResetPassword;
import com.moonkage.identity.auth.application.SendResetPasswordOtp;
import com.moonkage.identity.auth.application.VerifyAccount;
import com.moonkage.identity.platform.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FR-01, FR-02: each request parses itself first, so a 400 lists every bad field before any use case runs. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegisterAccount registerAccount;
    private final VerifyAccount verifyAccount;
    private final ResendVerifyOtp resendVerifyOtp;
    private final Login login;
    private final RefreshSession refreshSession;
    private final SendResetPasswordOtp sendResetPasswordOtp;
    private final ResetPassword resetPassword;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterAccountResponse>> register(@RequestBody RegisterAccountRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(RegisterAccountResponse.from(registerAccount.handle(request.toCommand()))));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(LoginResponse.from(login.handle(request.toCommand()))));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(LoginResponse.from(refreshSession.handle(request.toToken()))));
    }

    @PostMapping("/verify-account")
    public ResponseEntity<ApiResponse<VerifyAccountResponse>> verifyAccount(@RequestBody VerifyAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(VerifyAccountResponse.from(verifyAccount.handle(request.toCommand()))));
    }

    @PostMapping("/send-verify-account-otp")
    public ResponseEntity<ApiResponse<Void>> sendVerifyAccountOtp(@RequestBody SendOtpRequest request) {
        resendVerifyOtp.handle(request.toEmail());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody ResetPasswordRequest request) {
        resetPassword.handle(request.toCommand());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/send-reset-password-otp")
    public ResponseEntity<ApiResponse<Void>> sendResetPasswordOtp(@RequestBody SendOtpRequest request) {
        sendResetPasswordOtp.handle(request.toEmail());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
