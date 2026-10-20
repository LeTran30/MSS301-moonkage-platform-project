package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.RegisterAccountRequest;
import com.moonkage.identity.dto.request.VerifyAccountRequest;
import com.moonkage.identity.dto.response.AccountResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.dto.response.RegisterAccountResponse;
import com.moonkage.identity.dto.response.VerifyAccountResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.UserProfile;
import com.moonkage.identity.enums.OtpPurpose;
import com.moonkage.identity.enums.Role;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.mapper.AccountMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.UserProfileRepository;
import com.moonkage.identity.security.jwt.JwtClaims;
import com.moonkage.identity.security.jwt.JwtTokenProvider;
import com.moonkage.identity.service.AuthService;
import com.moonkage.identity.service.EmailService;
import com.moonkage.identity.service.OtpService;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Register and confirm an account (FR-01), log in and reset the password (FR-02). Flow and invariants:
 * docs/services/identity/classes/AuthServiceImpl.md.
 *
 * <p>The endpoints that send a code answer the same whether the email has an account or not, so they cannot be used
 * to find out which emails are registered.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final OtpService otpService;

    // ───────── FR-01: register and confirm the email ─────────

    @Override
    @Transactional
    public RegisterAccountResponse register(RegisterAccountRequest request) {
        String email = Account.toStoredEmail(request.email());
        String phoneNumber = Account.toStoredPhoneNumber(request.phoneNumber());
        String fullName = request.fullName().trim();
        validateUniqueness(email, phoneNumber);

        Account account = saveNewAccount(newMember(email, phoneNumber, request.password()));
        userProfileRepository.save(
                UserProfile.builder().account(account).fullName(fullName).build());
        boolean otpSent = trySendVerifyOtp(email, fullName);

        return AccountMapper.toRegisterResponse(account, otpSent);
    }

    @Override
    @Transactional
    public VerifyAccountResponse verifyAccount(VerifyAccountRequest request) {
        String email = Account.toStoredEmail(request.email());
        otpService.verifyOtp(OtpPurpose.VERIFY_ACCOUNT, email, request.otp());
        Account account = getOtpOwner(email);

        account.setAccountVerified(true);

        return AccountMapper.toVerifyResponse(account);
    }

    /** Sends a new code only to an account still waiting for confirmation; throttled in every case. */
    @Override
    public void sendVerifyAccountOtp(String email) {
        String storedEmail = Account.toStoredEmail(email);
        Optional<Account> unconfirmed =
                accountRepository.findByEmail(storedEmail).filter(account -> !account.isAccountVerified());
        if (unconfirmed.isEmpty()) {
            otpService.throttleSend(OtpPurpose.VERIFY_ACCOUNT, storedEmail);
            return;
        }
        issueAndSendVerifyOtp(storedEmail, getFullName(unconfirmed.get()));
    }

    // ───────── FR-02: log in, keep the session, reset the password ─────────

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username().trim(), request.password()));
            return buildLoginResponse((Account) authentication.getPrincipal());
        } catch (BadCredentialsException e) {
            // same answer whether the identifier exists or not
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            // e-mail not confirmed yet (Account.isEnabled); told only after the password matched
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        JwtClaims claims = jwtTokenProvider.parseRefreshToken(refreshToken);
        // a deleted account makes the token invalid, as JwtFilter does for access tokens
        Account account = accountRepository
                .findById(claims.accountId())
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_INVALID));
        if (!account.isAccountVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
        // a refresh token from before a password reset must not open a new session (Q-04)
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        return buildLoginResponse(account);
    }

    @Override
    public AccountResponse getMyAccount(String accountId) {
        Account account = getAccount(accountId);
        return AccountMapper.toAccountResponse(account, getProfile(account));
    }

    /** Sends a code only to a confirmed account (AC-02.1); throttled in every case. */
    @Override
    public void sendResetPasswordOtp(String email) {
        String storedEmail = Account.toStoredEmail(email);
        Optional<Account> confirmed = accountRepository.findByEmail(storedEmail).filter(Account::isAccountVerified);
        if (confirmed.isEmpty()) {
            otpService.throttleSend(OtpPurpose.RESET_PASSWORD, storedEmail);
            return;
        }
        issueAndSendResetOtp(storedEmail, getFullName(confirmed.get()));
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        String storedEmail = Account.toStoredEmail(email);
        // only a code sent by sendResetPasswordOtp works here, not a registration code (Q-05)
        otpService.verifyOtp(OtpPurpose.RESET_PASSWORD, storedEmail, otp);
        Account account = getOtpOwner(storedEmail);

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        // tokens issued before this moment stop working (Q-04)
        account.setPasswordChangedAt(Instant.now());
    }

    // ───────── helpers, in the order the methods above call them ─────────

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    private void validateUniqueness(String email, String phoneNumber) {
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, email);
        }
        if (phoneNumber != null && accountRepository.existsByPhoneNumber(phoneNumber)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, phoneNumber);
        }
    }

    /** A MEMBER whose email is not confirmed yet: it cannot log in until verifyAccount. */
    private Account newMember(String email, String phoneNumber, String password) {
        return Account.builder()
                .email(email)
                .phoneNumber(phoneNumber)
                .passwordHash(passwordEncoder.encode(password))
                .accountVerified(false)
                .role(Role.MEMBER)
                .build();
    }

    /**
     * Flushed here so a duplicate that slipped past validateUniqueness (two registrations in the same instant) hits
     * the unique key inside this method and answers 409 like the pre-check, not 500 at commit (AC-01.3).
     */
    private Account saveNewAccount(Account account) {
        try {
            return accountRepository.saveAndFlush(account);
        } catch (DataIntegrityViolationException e) {
            throw toDuplicateException(e, account);
        }
    }

    /** The violated unique key tells which identifier was taken; any other violation stays as it is. */
    private static RuntimeException toDuplicateException(DataIntegrityViolationException e, Account account) {
        String violatedKey =
                e.getCause() instanceof ConstraintViolationException cause ? cause.getConstraintName() : null;
        if (Account.EMAIL_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, account.getEmail());
        }
        if (Account.PHONE_NUMBER_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(ErrorCode.PHONE_ALREADY_EXISTS, account.getPhoneNumber());
        }
        return e;
    }

    /**
     * FR-01: a failed email keeps the account. The user asks for a new code with /send-verify-account-otp; registering
     * again would hit "email already used".
     */
    private boolean trySendVerifyOtp(String email, String fullName) {
        try {
            issueAndSendVerifyOtp(email, fullName);
            return true;
        } catch (AppException e) {
            return false;
        }
    }

    /** Throws when the email cannot be sent, after dropping the code the user never received. */
    private void issueAndSendVerifyOtp(String email, String name) {
        String otp = otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, email);
        try {
            emailService.sendVerifyAccountOtp(email, name, otp);
        } catch (AppException e) {
            otpService.clearOtp(OtpPurpose.VERIFY_ACCOUNT, email);
            throw e;
        }
    }

    /** A matching code whose account is gone answers like a wrong code. */
    private Account getOtpOwner(String email) {
        return accountRepository
                .findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED));
    }

    /** Falls back to the email when the profile is missing: the OTP mail still goes out. */
    private String getFullName(Account account) {
        return userProfileRepository
                .findById(account.getId())
                .map(UserProfile::getFullName)
                .orElse(account.getEmail());
    }

    private LoginResponse buildLoginResponse(Account account) {
        return AccountMapper.toLoginResponse(
                account,
                getProfile(account),
                jwtTokenProvider.createAccessToken(account),
                jwtTokenProvider.createRefreshToken(account));
    }

    private UserProfile getProfile(Account account) {
        return userProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
    }

    private Account getAccount(String accountId) {
        return accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
    }

    /** Silent on a send failure (see EmailService): the reply must not reveal whether the email has an account. */
    private void issueAndSendResetOtp(String email, String name) {
        String otp = otpService.issueOtp(OtpPurpose.RESET_PASSWORD, email);
        emailService.sendResetPasswordOtp(email, name, otp);
    }
}
