package com.bake2b.identity.service.impl;

import com.bake2b.identity.common.exception.CustomException;
import com.bake2b.identity.common.exception.EmailAlreadyExistsException;
import com.bake2b.identity.common.exception.InvalidCredentialsException;
import com.bake2b.identity.dto.request.AccountCreateRequest;
import com.bake2b.identity.dto.request.LoginRequest;
import com.bake2b.identity.dto.request.VerifyRequest;
import com.bake2b.identity.dto.response.AccountCreateResponse;
import com.bake2b.identity.dto.response.LoginResponse;
import com.bake2b.identity.entity.Account;
import com.bake2b.identity.entity.Role;
import com.bake2b.identity.entity.User;
import com.bake2b.identity.enums.AccountStatus;
import com.bake2b.identity.repository.AccountRepository;
import com.bake2b.identity.repository.RoleRepository;
import com.bake2b.identity.repository.UserRepository;
import com.bake2b.identity.repository.VendorRepository;
import com.bake2b.identity.service.AuthService;
import com.bake2b.identity.service.EmailService;
import com.bake2b.identity.service.TokenService;
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
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VendorRepository vendorRepository;
    private final TokenService tokenService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    // ───────── FR-01 ─────────

    @Override
    @Transactional
    public AccountCreateResponse register(AccountCreateRequest request) {
        request.setEmail(normalizeEmail(request.getEmail()));
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
        userRepository.save(User.builder()
                .fullName(request.getFullName().trim())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .account(account)
                .build());

        sendVerifyOtp(account.getEmail(), request.getFullName());
        return AccountCreateResponse.from(account);
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
        return AccountCreateResponse.from(account);
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
        switch (result) {
            case "EMAIL_EXISTS" -> throw new EmailAlreadyExistsException("Email đã được sử dụng");
            case "PHONE_EXISTS" -> throw new EmailAlreadyExistsException("Số điện thoại đã được sử dụng");
            default -> {}
        }
    }

    private void sendVerifyOtp(String email, String name) {
        String otp = emailService.generateOTP();
        emailService.storageOtp(email, otp);
        emailService.sendOtpForVerifyAccount(email, name, otp);
    }

    private LoginResponse buildLoginResponse(Account account, boolean withTokens) {
        User user = userRepository
                .findByAccountId(account.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy hồ sơ người dùng"));
        LoginResponse.LoginResponseBuilder builder = LoginResponse.builder()
                .accountId(account.getId())
                .userId(user.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(user.getFullName())
                .role(account.getRole().getRoleName())
                .vendorStatus("NONE");
        vendorRepository.findByOwnerId(user.getId()).ifPresent(v -> builder.vendorId(v.getId())
                .vendorStatus(v.getStatus().name()));
        if (withTokens) {
            builder.token(tokenService.createToken(account, user)).refreshToken(tokenService.refreshToken(account));
        }
        return builder.build();
    }

    private String fullName(Account account) {
        return userRepository
                .findByAccountId(account.getId())
                .map(User::getFullName)
                .orElse(account.getEmail());
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
