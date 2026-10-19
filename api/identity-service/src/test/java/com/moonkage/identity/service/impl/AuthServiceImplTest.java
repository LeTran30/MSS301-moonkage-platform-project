package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.enums.OtpPurpose;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.UserProfileRepository;
import com.moonkage.identity.security.jwt.JwtClaims;
import com.moonkage.identity.security.jwt.JwtTokenProvider;
import com.moonkage.identity.service.EmailService;
import com.moonkage.identity.service.OtpService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

/** FR-02: the OTP endpoints must answer the same whether the email has an account or not. */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String EMAIL = "a@x.vn";

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private OtpService otpService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void unconfirmedEmailIsToldOnlyAfterThePasswordMatched() {
        // Spring Security throws DisabledException from the post-authentication check (Account.isEnabled)
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("not confirmed"));

        AppException ex =
                assertThrows(AppException.class, () -> authService.login(new LoginRequest(EMAIL, "secret-123")));

        assertEquals(ErrorCode.ACCOUNT_NOT_ACTIVATED, ex.getErrorCode());
    }

    @Test
    void sendResetPasswordOtpThrottlesUnknownEmail() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        authService.sendResetPasswordOtp(" A@x.vn ");

        verify(otpService).throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL);
        verify(otpService, never()).issueOtp(any(), anyString());
        verify(emailService, never()).sendResetPasswordOtp(anyString(), anyString(), anyString());
    }

    @Test
    void sendResetPasswordOtpThrottlesUnverifiedAccount() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account(false)));

        authService.sendResetPasswordOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL);
        verify(otpService, never()).issueOtp(any(), anyString());
    }

    @Test
    void sendResetPasswordOtpIssuesForVerifiedAccount() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account(true)));
        when(userProfileRepository.findById(any())).thenReturn(Optional.empty());
        when(otpService.issueOtp(OtpPurpose.RESET_PASSWORD, EMAIL)).thenReturn("123456");

        authService.sendResetPasswordOtp(EMAIL);

        verify(emailService).sendResetPasswordOtp(EMAIL, EMAIL, "123456");
        verify(otpService, never()).throttleSend(any(), anyString());
    }

    @Test
    void sendResetPasswordOtpPassesCooldownThroughForUnknownEmail() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        doThrow(new AppException(ErrorCode.OTP_TOO_FREQUENT, 30L))
                .when(otpService)
                .throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL);

        AppException ex = assertThrows(AppException.class, () -> authService.sendResetPasswordOtp(EMAIL));
        assertEquals(ErrorCode.OTP_TOO_FREQUENT, ex.getErrorCode());
    }

    @Test
    void sendVerifyAccountOtpThrottlesUnknownEmail() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.VERIFY_ACCOUNT, EMAIL);
        verify(otpService, never()).issueOtp(any(), anyString());
    }

    @Test
    void sendVerifyAccountOtpThrottlesAlreadyActiveAccount() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account(true)));

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.VERIFY_ACCOUNT, EMAIL);
        verify(otpService, never()).issueOtp(any(), anyString());
    }

    @Test
    void sendVerifyAccountOtpIssuesForInactiveAccount() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account(false)));
        when(userProfileRepository.findById(any())).thenReturn(Optional.empty());
        when(otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, EMAIL)).thenReturn("123456");

        authService.sendVerifyAccountOtp(EMAIL);

        verify(emailService).sendVerifyAccountOtp(EMAIL, EMAIL, "123456");
        verify(otpService, never()).throttleSend(any(), anyString());
    }

    @Test
    void refreshTokenOfDeletedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims("acc-1", Instant.now()));
        when(accountRepository.findById("acc-1")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void refreshTokenOfUnconfirmedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims("acc-1", Instant.now()));
        when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account(false)));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(ErrorCode.ACCOUNT_NOT_ACTIVATED, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void refreshTokenFromBeforeAPasswordResetFails() {
        Account account = account(true);
        account.setPasswordChangedAt(Instant.now());
        Instant issuedBeforeReset = Instant.now().minusSeconds(3600);
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims("acc-1", issuedBeforeReset));
        when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(ErrorCode.REFRESH_TOKEN_INVALID, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void passwordResetAcceptsOnlyAResetCodeAndEndsOldSessions() {
        Account account = account(true);
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account));
        when(passwordEncoder.encode("new-secret-1")).thenReturn("hash");

        authService.resetPassword(EMAIL, "123456", "new-secret-1");

        verify(otpService, never()).verifyOtp(eq(OtpPurpose.VERIFY_ACCOUNT), anyString(), anyString());
        assertEquals("hash", account.getPasswordHash());
        assertNotNull(account.getPasswordChangedAt());
    }

    private static Account account(boolean emailConfirmed) {
        return Account.builder()
                .id("acc-1")
                .email(EMAIL)
                .accountVerified(emailConfirmed)
                .build();
    }
}
