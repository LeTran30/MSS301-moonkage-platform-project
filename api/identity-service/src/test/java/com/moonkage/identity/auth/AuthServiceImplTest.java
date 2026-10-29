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

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.email.EmailService;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.security.JwtClaims;
import com.moonkage.identity.security.JwtTokenProvider;
import com.moonkage.identity.shared.AccountId;
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

/** FR-02: the OTP endpoints must answer the same whether the email has an account or not. */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final AccountId ID = AccountId.fromStored(ACCOUNT_ID);
    private static final String EMAIL = "a@x.vn";
    private static final Email EMAIL_VO = Email.of(EMAIL);
    private static final OtpCode CODE = new OtpCode("123456");

    @Mock
    private AccountApi accountApi;

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private EmailService emailService;

    @Mock
    private OtpApi otpApi;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void registrationCreatesAccountAndProfileThenSendsTheCode() {
        when(accountApi.registerMember(EMAIL_VO, PhoneNumber.of("0912345678"), RawPassword.parse("secret-123")))
                .thenReturn(account(false));
        when(otpApi.issue(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO)).thenReturn(CODE);

        RegisterAccountResponse response = authService.register(registerRequest());

        verify(userProfileService).createProfile(ACCOUNT_ID, "Nguyen Lan");
        verify(emailService).sendVerifyAccountOtp(EMAIL_VO, "Nguyen Lan", "123456");
        assertEquals(ACCOUNT_ID, response.id());
        assertEquals(true, response.otpSent());
    }

    @Test
    void takenIdentifierStopsRegistrationBeforeTheProfile() {
        when(accountApi.registerMember(any(), any(), any()))
                .thenThrow(new AppException(AccountError.EMAIL_ALREADY_EXISTS, EMAIL));

        AppException ex = assertThrows(AppException.class, () -> authService.register(registerRequest()));

        assertEquals(AccountError.EMAIL_ALREADY_EXISTS, ex.getErrorCode());
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
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());

        authService.sendResetPasswordOtp(" A@x.vn ");

        verify(otpApi).throttle(OtpPurpose.RESET_PASSWORD, EMAIL_VO);
        verify(otpApi, never()).issue(any(), any());
        verify(emailService, never()).sendResetPasswordOtp(any(), anyString(), anyString());
    }

    @Test
    void sendResetPasswordOtpThrottlesUnverifiedAccount() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(false)));

        authService.sendResetPasswordOtp(EMAIL);

        verify(otpApi).throttle(OtpPurpose.RESET_PASSWORD, EMAIL_VO);
        verify(otpApi, never()).issue(any(), any());
    }

    @Test
    void sendResetPasswordOtpIssuesForVerifiedAccount() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));
        when(userProfileService.findFullName(ACCOUNT_ID)).thenReturn(Optional.empty());
        when(otpApi.issue(OtpPurpose.RESET_PASSWORD, EMAIL_VO)).thenReturn(CODE);

        authService.sendResetPasswordOtp(EMAIL);

        verify(emailService).sendResetPasswordOtp(EMAIL_VO, EMAIL, "123456");
        verify(otpApi, never()).throttle(any(), any());
    }

    @Test
    void sendResetPasswordOtpPassesCooldownThroughForUnknownEmail() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());
        doThrow(new AppException(OtpError.TOO_FREQUENT, 30L))
                .when(otpApi)
                .throttle(OtpPurpose.RESET_PASSWORD, EMAIL_VO);

        AppException ex = assertThrows(AppException.class, () -> authService.sendResetPasswordOtp(EMAIL));
        assertEquals(OtpError.TOO_FREQUENT, ex.getErrorCode());
    }

    @Test
    void sendVerifyAccountOtpThrottlesUnknownEmail() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.empty());

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpApi).throttle(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO);
        verify(otpApi, never()).issue(any(), any());
    }

    @Test
    void sendVerifyAccountOtpThrottlesAlreadyActiveAccount() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));

        authService.sendVerifyAccountOtp(EMAIL);

        verify(otpApi).throttle(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO);
        verify(otpApi, never()).issue(any(), any());
    }

    @Test
    void sendVerifyAccountOtpIssuesForInactiveAccount() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(false)));
        when(userProfileService.findFullName(ACCOUNT_ID)).thenReturn(Optional.empty());
        when(otpApi.issue(OtpPurpose.VERIFY_ACCOUNT, EMAIL_VO)).thenReturn(CODE);

        authService.sendVerifyAccountOtp(EMAIL);

        verify(emailService).sendVerifyAccountOtp(EMAIL_VO, EMAIL, "123456");
        verify(otpApi, never()).throttle(any(), any());
    }

    @Test
    void refreshTokenOfDeletedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountApi.find(ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.REFRESH_TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void refreshTokenOfUnconfirmedAccountFails() {
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountApi.find(ID)).thenReturn(Optional.of(account(false)));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.ACCOUNT_NOT_ACTIVATED, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void refreshTokenFromBeforeAPasswordResetFails() {
        AccountView account = new AccountView(ID, EMAIL_VO, null, Role.MEMBER, true, Instant.now());
        Instant issuedBeforeReset = Instant.now().minusSeconds(3600);
        when(jwtTokenProvider.parseRefreshToken("rt")).thenReturn(new JwtClaims(ACCOUNT_ID, issuedBeforeReset));
        when(accountApi.find(ID)).thenReturn(Optional.of(account));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken("rt"));
        assertEquals(LegacyError.REFRESH_TOKEN_INVALID, ex.getErrorCode());
        verify(jwtTokenProvider, never()).createAccessToken(any());
    }

    @Test
    void passwordResetAcceptsOnlyAResetCodeAndChangesThePassword() {
        when(accountApi.findByEmail(EMAIL_VO)).thenReturn(Optional.of(account(true)));

        authService.resetPassword(EMAIL, "123456", "new-secret-1");

        verify(otpApi).verify(OtpPurpose.RESET_PASSWORD, EMAIL_VO, CODE);
        verify(otpApi, never()).verify(eq(OtpPurpose.VERIFY_ACCOUNT), any(), any());
        verify(accountApi).changePassword(ID, RawPassword.parse("new-secret-1"));
    }

    private static AccountView account(boolean emailConfirmed) {
        return new AccountView(ID, EMAIL_VO, null, Role.MEMBER, emailConfirmed, null);
    }
}
