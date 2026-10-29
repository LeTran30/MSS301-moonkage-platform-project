package com.moonkage.identity.auth;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.VerifyAccountRequest;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;
import com.moonkage.identity.email.EmailService;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.security.AccountPrincipal;
import com.moonkage.identity.security.JwtClaims;
import com.moonkage.identity.security.JwtTokenProvider;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class AuthServiceImpl implements AuthService {

    private final AccountApi accountApi;
    private final UserProfileService userProfileService;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final OtpApi otpApi;

    // ───────── FR-01: register and confirm the email ─────────

    @Override
    @Transactional
    public RegisterAccountResponse register(RegisterAccountRequest request) {
        Email email = Email.of(request.email());
        PhoneNumber phoneNumber = request.phoneNumber() == null ? null : PhoneNumber.of(request.phoneNumber());
        String fullName = request.fullName();

        AccountView account = accountApi.registerMember(email, phoneNumber, RawPassword.parse(request.password()));
        userProfileService.createProfile(account.id().toString(), fullName);
        boolean otpSent = trySendVerifyOtp(email, fullName);

        return AuthMapper.toRegisterResponse(account, otpSent);
    }

    @Override
    @Transactional
    public VerifyAccountResponse verifyAccount(VerifyAccountRequest request) {
        Email email = Email.of(request.email());
        otpApi.verify(OtpPurpose.VERIFY_ACCOUNT, email, OtpCode.parse(request.otp()));
        AccountView account = accountApi.confirmEmail(getOtpOwner(email).id());

        return AuthMapper.toVerifyResponse(account);
    }

    /** Sends a new code only to an account still waiting for confirmation; throttled in every case. */
    @Override
    public void sendVerifyAccountOtp(String emailStr) {
        Email email = Email.of(emailStr);
        Optional<AccountView> unconfirmed = accountApi.findByEmail(email).filter(account -> !account.verified());
        if (unconfirmed.isEmpty()) {
            otpApi.throttle(OtpPurpose.VERIFY_ACCOUNT, email);
            return;
        }
        issueAndSendVerifyOtp(email, getFullName(unconfirmed.get()));
    }

    // ───────── FR-02: log in, keep the session, reset the password ─────────

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
            return buildLoginResponse(((AccountPrincipal) authentication.getPrincipal()).account());
        } catch (BadCredentialsException e) {
            // same answer whether the identifier exists or not
            throw new AppException(LegacyError.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            // e-mail not confirmed yet (AccountPrincipal.isEnabled); told only after the password matched
            throw new AppException(LegacyError.ACCOUNT_NOT_ACTIVATED);
        }
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        JwtClaims claims = jwtTokenProvider.parseRefreshToken(refreshToken);
        // a deleted account makes the token invalid, as JwtFilter does for access tokens
        AccountView account = AccountId.tryParse(claims.accountId())
                .flatMap(accountApi::find)
                .orElseThrow(() -> new AppException(LegacyError.REFRESH_TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(LegacyError.ACCOUNT_NOT_ACTIVATED);
        }
        // a refresh token from before a password reset must not open a new session (Q-04)
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(LegacyError.REFRESH_TOKEN_INVALID);
        }

        return buildLoginResponse(account);
    }

    /** Sends a code only to a confirmed account (AC-02.1); throttled in every case. */
    @Override
    public void sendResetPasswordOtp(String emailStr) {
        Email email = Email.of(emailStr);
        Optional<AccountView> confirmed = accountApi.findByEmail(email).filter(AccountView::verified);
        if (confirmed.isEmpty()) {
            otpApi.throttle(OtpPurpose.RESET_PASSWORD, email);
            return;
        }
        issueAndSendResetOtp(email, getFullName(confirmed.get()));
    }

    @Override
    @Transactional
    public void resetPassword(String emailStr, String otp, String newPassword) {
        Email email = Email.of(emailStr);
        // only a code sent by sendResetPasswordOtp works here, not a registration code (Q-05)
        otpApi.verify(OtpPurpose.RESET_PASSWORD, email, OtpCode.parse(otp));
        AccountView account = getOtpOwner(email);

        accountApi.changePassword(account.id(), RawPassword.parse(newPassword));
    }

    // ───────── helpers, in the order the methods above call them ─────────

    /**
     * FR-01: a failed email keeps the account. The user asks for a new code with /send-verify-account-otp; registering
     * again would hit "email already used".
     */
    private boolean trySendVerifyOtp(Email email, String fullName) {
        try {
            issueAndSendVerifyOtp(email, fullName);
            return true;
        } catch (AppException e) {
            return false;
        }
    }

    /** Throws when the email cannot be sent, after dropping the code the user never received. */
    private void issueAndSendVerifyOtp(Email email, String name) {
        OtpCode otp = otpApi.issue(OtpPurpose.VERIFY_ACCOUNT, email);
        try {
            emailService.sendVerifyAccountOtp(email, name, otp.value());
        } catch (AppException e) {
            otpApi.discard(OtpPurpose.VERIFY_ACCOUNT, email);
            throw e;
        }
    }

    /** A matching code whose account is gone answers like a wrong code. */
    private AccountView getOtpOwner(Email email) {
        return accountApi.findByEmail(email).orElseThrow(() -> new AppException(OtpError.INVALID_OR_EXPIRED));
    }

    /** Falls back to the email when the profile is missing: the OTP mail still goes out. */
    private String getFullName(AccountView account) {
        return userProfileService
                .findFullName(account.id().toString())
                .orElse(account.email().value());
    }

    private LoginResponse buildLoginResponse(AccountView account) {
        return AuthMapper.toLoginResponse(
                account,
                userProfileService.getFullName(account.id().toString()),
                jwtTokenProvider.createAccessToken(account),
                jwtTokenProvider.createRefreshToken(account));
    }

    /** Silent on a send failure (see EmailService): the reply must not reveal whether the email has an account. */
    private void issueAndSendResetOtp(Email email, String name) {
        OtpCode otp = otpApi.issue(OtpPurpose.RESET_PASSWORD, email);
        emailService.sendResetPasswordOtp(email, name, otp.value());
    }
}
