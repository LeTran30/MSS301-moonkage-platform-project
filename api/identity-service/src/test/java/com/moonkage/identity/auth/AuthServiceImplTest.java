package com.moonkage.identity.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.email.EmailService;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.OtpService;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.security.JwtClaims;
import com.moonkage.identity.security.JwtTokenProvider;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
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

    private static final String ACCOUNT_ID = "acc-1";
    private static final String EMAIL = "a@x.vn";
    private static final Email EMAIL_VO = Email.of(EMAIL);
    private static final String ENCODED_PASSWORD = "$2a$10$abcdefghijklmnopqrstuuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a";

    @Mock
    private AccountService accountService;

    @Mock
    private UserProfileService userProfileService;

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
    void registrationCreatesAccountAndProfileThenSendsTheCode() {
        when(passwordEncoder.encode("secret-123")).thenReturn(ENCODED_PASSWORD);
        when(accountService.createMember(EMAIL_VO, PhoneNumber.of("0912345678"), PasswordHash.of(ENCODED_PASSWORD)))
                .thenReturn(account(false));
        when(otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO)).thenReturn("123456");

        RegisterAccountResponse response = authService.register(registerRequest());

        verify(userProfileService).createProfile(ACCOUNT_ID, "Nguyen Lan");
        verify(emailService).sendVerifyAccountOtp(EMAIL_VO, "Nguyen Lan", "123456");
        assertEquals(ACCOUNT_ID, response.id());
        assertEquals(true, response.otpSent());
    }

    @Test
    void takenIdentifierStopsRegistrationBeforeTheProfile() {
        when(passwordEncoder.encode(anyString())).thenReturn(ENCODED_PASSWORD);
        when(accountService.createMember(any(), any(), any()))
                .thenThrow(new AppException(LegacyError.EMAIL_ALREADY_EXISTS, EMAIL));

        AppException ex = assertThrows(AppException.class, () -> authService.register(registerRequest()));

        assertEquals(LegacyError.EMAIL_ALREADY_EXISTS, ex.getErrorCode());
        verify(userProfileService, never()).createProfile(anyString(), anyString());
    }

    private static RegisterAccountRequest registerRequest() {
        return RegisterAccountRequest.builder()
                .email(EMAIL)
                .phoneNumber("0912345678")
                .fullName("Nguyen Lan")
                .password("secret-123")
                .build();
    }

    @Test
    void unconfirmedEmailIsToldOnlyAfterThePasswordMatched() {
        // Spring Security throws DisabledException from the post-authentication check (AccountPrincipal.isEnabled)
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("not confirmed"));

        AppException ex =
                assertThrows(AppException.class, () -> authService.login(new LoginRequest(EMAIL, "secret-123")));

        assertEquals(LegacyError.ACCOUNT_NOT_ACTIVATED, ex.getErrorCode());
    }

    @Test
    void sendResetPasswordOtpThrottlesUnknownEmail() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());

        authService.sendResetPasswordOtp(" A@x.vn ");

        verify(otpService).throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL_VO);
        verify(otpService, never()).issueOtp(any(), any());
        verify(emailService, never()).sendResetPasswordOtp(any(), anyString(), anyString());
    }

    @Test
    void sendResetPasswordOtpThrottlesUnverifiedAccount() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(false)));

        authService.sendResetPasswordOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL_VO);
        verify(otpService, never()).issueOtp(any(), any());
    }

    @Test
    void sendResetPasswordOtpIssuesForVerifiedAccount() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));
        when(userProfileService.findFullName(ACCOUNT_ID)).thenReturn(Optional.empty());
        when(otpService.issueOtp(OtpPurpose.RESET_PASSWORD, EMAIL_VO)).thenReturn("123456");

        authService.sendResetPasswordOtp(EMAIL);

        verify(emailService).sendResetPasswordOtp(EMAIL_VO, EMAIL, "123456");
        verify(otpService, never()).throttleSend(any(), any());
    }

    @Test
    void sendResetPasswordOtpPassesCooldownThroughForUnknownEmail() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());
        doThrow(new AppException(LegacyError.OTP_TOO_FREQUENT, 30L))
                .when(otpService)
                .throttleSend(OtpPurpose.RESET_PASSWORD, EMAIL_VO);

        AppException ex = assertThrows(AppException.class, () -> authService.sendResetPasswordOtp(EMAIL));
        assertEquals(LegacyError.OTP_TOO_FREQUENT, ex.getErrorCode());
    }

    @Test
    void sendVerifyAccountOtpThrottlesUnknownEmail() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO);
        verify(otpService, never()).issueOtp(any(), any());
    }

    @Test
    void sendVerifyAccountOtpThrottlesAlreadyActiveAccount() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpService).throttleSend(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO);
        verify(otpService, never()).issueOtp(any(), any());
    }

    @Test
    void sendVerifyAccountOtpIssuesForInactiveAccount() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(false)));
        when(userProfileService.findFullName(ACCOUNT_ID)).thenReturn(Optional.empty());
        when(otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO)).thenReturn("123456");

        authService.sendVerifyAccountOtp(EMAIL);

        verify(emailService).sendVerifyAccountOtp(EMAIL_VO, EMAIL, "123456");
        verify(otpService, never()).throttleSend(any(), any());
    }

    @Test
    void refreshTokenOfDeletedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountService.findAccount(ACCOUNT_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.REFRESH_TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void refreshTokenOfUnconfirmedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountService.findAccount(ACCOUNT_ID)).thenReturn(Optional.of(account(false)));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.ACCOUNT_NOT_ACTIVATED, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void refreshTokenFromBeforeAPasswordResetFails() {
        AccountView account = new AccountView(ACCOUNT_ID, EMAIL, null, Role.MEMBER, true, Instant.now());
        Instant issuedBeforeReset = Instant.now().minusSeconds(3600);
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, issuedBeforeReset));
        when(accountService.findAccount(ACCOUNT_ID)).thenReturn(Optional.of(account));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.REFRESH_TOKEN_INVALID, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void passwordResetAcceptsOnlyAResetCodeAndChangesThePassword() {
        when(accountService.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));
        when(passwordEncoder.encode("new-secret-1")).thenReturn(ENCODED_PASSWORD);

        authService.resetPassword(EMAIL, "123456", "new-secret-1");

        verify(otpService).verifyOtp(OtpPurpose.RESET_PASSWORD, EMAIL_VO, "123456");
        verify(otpService, never()).verifyOtp(eq(OtpPurpose.VERIFY_ACCOUNT), any(), anyString());
        verify(accountService).changePassword(ACCOUNT_ID, PasswordHash.of(ENCODED_PASSWORD));
    }

    private static AccountView account(boolean emailConfirmed) {
        return new AccountView(ACCOUNT_ID, EMAIL, null, Role.MEMBER, emailConfirmed, null);
    }
}
