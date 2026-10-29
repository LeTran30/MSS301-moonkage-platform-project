package com.moonkage.identity.auth;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.RegisterAccountResponse;
import com.moonkage.identity.auth.dto.VerifyAccountRequest;
import com.moonkage.identity.auth.dto.VerifyAccountResponse;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import com.moonkage.identity.email.EmailService;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.OtpService;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.security.AccountPrincipal;
import com.moonkage.identity.security.JwtClaims;
import com.moonkage.identity.security.JwtTokenProvider;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class AuthServiceImpl implements AuthService {

    private final PasswordEncoder passwordEncoder;
    private final AccountService accountService;
    private final UserProfileService userProfileService;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final OtpService otpService;

    // ───────── FR-01: register and confirm the email ─────────

    @Override
    @Transactional
    public RegisterAccountResponse register(RegisterAccountRequest request) {
        Email email = Email.of(request.email());
        PhoneNumber phoneNumber = request.phoneNumber() == null ? null : PhoneNumber.of(request.phoneNumber());
        String fullName = request.fullName();

        AccountView account = accountService.createMember(
                email, phoneNumber, PasswordHash.fromRawPassword(request.password(), passwordEncoder));
        userProfileService.createProfile(account.id(), fullName);
        boolean otpSent = trySendVerifyOtp(email, fullName);

        return AuthMapper.toRegisterResponse(account, otpSent);
    }

    @Override
    @Transactional
    public VerifyAccountResponse verifyAccount(VerifyAccountRequest request) {
        Email email = Email.of(request.email());
        otpService.verifyOtp(OtpPurpose.VERIFY_ACCOUNT, email, request.otp());
        AccountView account = accountService.confirmEmail(getOtpOwner(email).id());

        return AuthMapper.toVerifyResponse(account);
    }

    /** Sends a new code only to an account still waiting for confirmation; throttled in every case. */
    @Override
    public void sendVerifyAccountOtp(String emailStr) {
        Email email = Email.of(emailStr);
        Optional<AccountView> unconfirmed = accountService.findByEmail(email).filter(account -> !account.verified());
        if (unconfirmed.isEmpty()) {
            otpService.throttleSend(OtpPurpose.VERIFY_ACCOUNT, email);
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
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            // e-mail not confirmed yet (AccountPrincipal.isEnabled); told only after the password matched
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        JwtClaims claims = jwtTokenProvider.parseRefreshToken(refreshToken);
        // a deleted account makes the token invalid, as JwtFilter does for access tokens
        AccountView account = accountService
                .findAccount(claims.accountId())
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
        // a refresh token from before a password reset must not open a new session (Q-04)
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        return buildLoginResponse(account);
    }

    /** Sends a code only to a confirmed account (AC-02.1); throttled in every case. */
    @Override
    public void sendResetPasswordOtp(String emailStr) {
        Email email = Email.of(emailStr);
        Optional<AccountView> confirmed = accountService.findByEmail(email).filter(AccountView::verified);
        if (confirmed.isEmpty()) {
            otpService.throttleSend(OtpPurpose.RESET_PASSWORD, email);
            return;
        }
        issueAndSendResetOtp(email, getFullName(confirmed.get()));
    }

    @Override
    @Transactional
    public void resetPassword(String emailStr, String otp, String newPassword) {
        Email email = Email.of(emailStr);
        // only a code sent by sendResetPasswordOtp works here, not a registration code (Q-05)
        otpService.verifyOtp(OtpPurpose.RESET_PASSWORD, email, otp);
        AccountView account = getOtpOwner(email);

        accountService.changePassword(account.id(), PasswordHash.fromRawPassword(newPassword, passwordEncoder));
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
        String otp = otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, email);
        try {
            emailService.sendVerifyAccountOtp(email, name, otp);
        } catch (AppException e) {
            otpService.clearOtp(OtpPurpose.VERIFY_ACCOUNT, email);
            throw e;
        }
    }

    /** A matching code whose account is gone answers like a wrong code. */
    private AccountView getOtpOwner(Email email) {
        return accountService.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED));
    }

    /** Falls back to the email when the profile is missing: the OTP mail still goes out. */
    private String getFullName(AccountView account) {
        return userProfileService.findFullName(account.id()).orElse(account.email());
    }

    private LoginResponse buildLoginResponse(AccountView account) {
        return AuthMapper.toLoginResponse(
                account,
                userProfileService.getFullName(account.id()),
                jwtTokenProvider.createAccessToken(account),
                jwtTokenProvider.createRefreshToken(account));
    }

    /** Silent on a send failure (see EmailService): the reply must not reveal whether the email has an account. */
    private void issueAndSendResetOtp(Email email, String name) {
        String otp = otpService.issueOtp(OtpPurpose.RESET_PASSWORD, email);
        emailService.sendResetPasswordOtp(email, name, otp);
    }
}
