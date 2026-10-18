package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.request.AccountCreateRequest;
import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.VerifyRequest;
import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.LoginResponse;
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
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
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

    // ───────── FR-01 ─────────

    @Override
    @Transactional
    public AccountCreateResponse register(AccountCreateRequest request) {
        // normalized into locals: the incoming request is left as the client sent it
        String email = normalizeEmail(request.getEmail());
        String phoneNumber = Account.storedPhoneNumber(request.getPhoneNumber());
        validateUniqueness(email, phoneNumber);

        Account account = accountRepository.save(Account.builder()
                .email(email)
                .phoneNumber(phoneNumber)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .accountVerified(false)
                .role(Role.MEMBER)
                .build());
        userProfileRepository.save(UserProfile.builder()
                .account(account)
                .fullName(request.getFullName().trim())
                .build());

        // FR-01: keep the account when the email fails; the user retries with /resend-otp instead of
        // registering again (which would now hit "email already used")
        boolean otpSent = true;
        try {
            sendVerifyOtp(account.getEmail(), request.getFullName());
        } catch (AppException e) {
            otpSent = false;
        }
        AccountCreateResponse response = AccountMapper.toCreateResponse(account);
        response.setOtpSent(otpSent);
        return response;
    }

    @Override
    @Transactional
    public AccountCreateResponse verifyAccount(VerifyRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!otpService.verifyOtp(OtpPurpose.VERIFY_ACCOUNT, email, request.getOtp())) {
            throw new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED);
        }
        Account account = accountRepository
                .findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED));
        account.setAccountVerified(true);
        return AccountMapper.toCreateResponse(account);
    }

    /**
     * Silent when the email is unknown or already verified, so it cannot be used to probe accounts. Throttled
     * either way, so a cooldown reply does not give the account away either.
     */
    @Override
    public void resendOtp(String email) {
        String normalized = normalizeEmail(email);
        accountRepository
                .findByEmail(normalized)
                .filter(a -> !a.isAccountVerified())
                .ifPresentOrElse(
                        a -> sendVerifyOtp(normalized, fullName(a)),
                        () -> otpService.throttleSend(OtpPurpose.VERIFY_ACCOUNT, normalized));
    }

    // ───────── FR-02 ─────────

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.getUsername().trim(), request.getPassword()));
            Account account = (Account) authentication.getPrincipal();
            return buildLoginResponse(account, true);
        } catch (BadCredentialsException e) {
            // FR-02: same message whether the identifier exists or not
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            // e-mail not confirmed yet (Account.isEnabled); told only after the password matched
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        JwtClaims claims = jwtTokenProvider.parseRefreshToken(refreshToken);
        String accountId = claims.accountId();
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        if (!account.isAccountVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
        // a refresh token from before a password reset must not open a new session (Q-04)
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        return buildLoginResponse(account, true);
    }

    @Override
    public LoginResponse getMyProfile(String accountId) {
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        return buildLoginResponse(account, false);
    }

    /**
     * AC-02.1: OTP only goes to a verified email. Silent otherwise (no account probing); throttled either way,
     * so a cooldown reply does not give the account away either.
     */
    @Override
    public void forgotPasswordSendOtp(String email) {
        String normalized = normalizeEmail(email);
        accountRepository
                .findByEmail(normalized)
                .filter(Account::isAccountVerified)
                .ifPresentOrElse(
                        a -> {
                            String otp = otpService.issueOtp(OtpPurpose.RESET_PASSWORD, normalized);
                            emailService.sendOtpForForgotPassword(normalized, fullName(a), otp);
                        },
                        () -> otpService.throttleSend(OtpPurpose.RESET_PASSWORD, normalized));
    }

    @Override
    @Transactional
    public void forgotPasswordReset(String email, String otp, String newPassword) {
        String normalized = normalizeEmail(email);
        // only a code sent by forgotPasswordSendOtp works here, not a registration code (Q-05)
        if (!otpService.verifyOtp(OtpPurpose.RESET_PASSWORD, normalized, otp)) {
            throw new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED);
        }
        Account account = accountRepository
                .findByEmail(normalized)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID_OR_EXPIRED));
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        // tokens issued before this moment stop working (Q-04)
        account.setPasswordChangedAt(Instant.now());
    }

    // ───────── helpers ─────────

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    private void validateUniqueness(String email, String phoneNumber) {
        String result = accountRepository.validateAccountUniqueness(email, phoneNumber);
        if (AccountRepository.VALIDATION_EMAIL_EXISTS.equals(result)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, email);
        } else if (AccountRepository.VALIDATION_PHONE_EXISTS.equals(result)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, phoneNumber);
        }
    }

    private void sendVerifyOtp(String email, String name) {
        String otp = otpService.issueOtp(OtpPurpose.VERIFY_ACCOUNT, email);
        try {
            emailService.sendOtpForVerifyAccount(email, name, otp);
        } catch (AppException e) {
            otpService.clearOtp(OtpPurpose.VERIFY_ACCOUNT, email); // the user never received it
            throw e;
        }
    }

    private LoginResponse buildLoginResponse(Account account, boolean withTokens) {
        UserProfile profile = userProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
        return withTokens
                ? AccountMapper.toLoginResponse(
                        account,
                        profile,
                        jwtTokenProvider.createAccessToken(account),
                        jwtTokenProvider.createRefreshToken(account))
                : AccountMapper.toLoginResponse(account, profile, null, null);
    }

    private String fullName(Account account) {
        return userProfileRepository
                .findById(account.getId())
                .map(UserProfile::getFullName)
                .orElse(account.getEmail());
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
