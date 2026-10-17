package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.request.AccountCreateRequest;
import com.moonkage.identity.dto.request.LoginRequest;
import com.moonkage.identity.dto.request.VerifyRequest;
import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Role;
import com.moonkage.identity.entity.UserProfile;
import com.moonkage.identity.enums.AccountStatus;
import com.moonkage.identity.exception.CustomException;
import com.moonkage.identity.exception.EmailAlreadyExistsException;
import com.moonkage.identity.exception.EmailDeliveryException;
import com.moonkage.identity.exception.InvalidCredentialsException;
import com.moonkage.identity.mapper.AccountMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.RoleRepository;
import com.moonkage.identity.repository.UserProfileRepository;
import com.moonkage.identity.service.AuthService;
import com.moonkage.identity.service.EmailService;
import com.moonkage.identity.service.TokenService;
import com.moonkage.identity.util.PhoneNumbers;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    public static final String DEFAULT_ROLE = "CUSTOMER";

    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final TokenService tokenService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    // ───────── FR-01 ─────────

    @Override
    @Transactional
    public AccountCreateResponse register(AccountCreateRequest request) {
        request.setEmail(normalizeEmail(request.getEmail()));
        request.setPhoneNumber(PhoneNumbers.normalize(request.getPhoneNumber()));
        validateUniqueness(request);

        Role defaultRole = roleRepository
                .findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new CustomException("Role " + DEFAULT_ROLE + " chưa được khởi tạo"));
        Account account = accountRepository.save(Account.builder()
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(AccountStatus.INACTIVE)
                .accountVerified(false)
                .role(defaultRole)
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
        } catch (EmailDeliveryException e) {
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
        if (!emailService.verifyOtp(email, request.getOtp())) {
            throw new CustomException("OTP không đúng hoặc đã hết hạn.");
        }
        emailService.clearOtp(email);
        Account account = accountRepository
                .findByEmail(email)
                .orElseThrow(() -> new CustomException("OTP không đúng hoặc đã hết hạn."));
        if (account.getStatus() == AccountStatus.INACTIVE) {
            account.setStatus(AccountStatus.ACTIVE);
        }
        account.setAccountVerified(true);
        return AccountMapper.toCreateResponse(account);
    }

    /** Silent when the email is unknown or already verified, so it cannot be used to probe accounts. */
    @Override
    public void resendOtp(String email) {
        accountRepository
                .findByEmail(normalizeEmail(email))
                .filter(a -> a.getStatus() == AccountStatus.INACTIVE)
                .ifPresent(a -> sendVerifyOtp(a.getEmail(), fullName(a)));
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
            throw new InvalidCredentialsException();
        } catch (DisabledException e) {
            throw new CustomException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và xác thực OTP.");
        } catch (LockedException e) {
            throw new CustomException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        Account account;
        try {
            account = tokenService.getAccountFromRefreshToken(refreshToken);
        } catch (Exception e) {
            throw new InvalidCredentialsException(
                    "Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        if (!account.isEnabled() || !account.isAccountNonLocked()) {
            throw new CustomException("Tài khoản đã bị khóa hoặc ngừng hoạt động.");
        }
        return buildLoginResponse(account, true);
    }

    @Override
    public LoginResponse getMyProfile(String accountId) {
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản"));
        return buildLoginResponse(account, false);
    }

    /** AC-02.1: OTP only goes to a verified email. Silent otherwise (no account probing). */
    @Override
    public void forgotPasswordSendOtp(String email) {
        accountRepository
                .findByEmail(normalizeEmail(email))
                .filter(a -> Boolean.TRUE.equals(a.getAccountVerified()) && a.getStatus() == AccountStatus.ACTIVE)
                .ifPresent(a -> {
                    String otp = emailService.generateOTP();
                    emailService.storageOtp(a.getEmail(), otp);
                    emailService.sendOtpForForgotPassword(a.getEmail(), fullName(a), otp);
                });
    }

    @Override
    @Transactional
    public void forgotPasswordReset(String email, String otp, String newPassword) {
        String normalized = normalizeEmail(email);
        if (!emailService.verifyOtp(normalized, otp)) {
            throw new CustomException("OTP không đúng hoặc đã hết hạn.");
        }
        emailService.clearOtp(normalized);
        Account account = accountRepository
                .findByEmail(normalized)
                .orElseThrow(() -> new CustomException("OTP không đúng hoặc đã hết hạn."));
        account.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    // ───────── helpers ─────────

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    private void validateUniqueness(AccountCreateRequest request) {
        String result = accountRepository.validateAccountUniqueness(request.getEmail(), request.getPhoneNumber());
        if (result.equals("EMAIL_EXISTS")) {
            throw new EmailAlreadyExistsException("Email đã được sử dụng");
        } else if (result.equals("PHONE_EXISTS")) {
            throw new EmailAlreadyExistsException("Số điện thoại đã được sử dụng");
        }
    }

    private void sendVerifyOtp(String email, String name) {
        String otp = emailService.generateOTP();
        emailService.storageOtp(email, otp);
        try {
            emailService.sendOtpForVerifyAccount(email, name, otp);
        } catch (EmailDeliveryException e) {
            emailService.clearOtp(email); // the user never received it
            throw e;
        }
    }

    private LoginResponse buildLoginResponse(Account account, boolean withTokens) {
        UserProfile profile = userProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy hồ sơ người dùng"));
        LoginResponse.LoginResponseBuilder builder = LoginResponse.builder()
                .accountId(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(profile.getFullName())
                .role(account.getRole().getRoleName());
        if (withTokens) {
            builder.token(tokenService.createToken(account)).refreshToken(tokenService.refreshToken(account));
        }
        return builder.build();
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
