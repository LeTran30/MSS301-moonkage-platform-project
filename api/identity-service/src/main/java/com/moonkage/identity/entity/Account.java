package com.moonkage.identity.entity;

import com.moonkage.identity.constant.PhoneConstant;
import com.moonkage.identity.constant.SecurityConstant;
import com.moonkage.identity.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Login credentials (FR-01, FR-02). Login identifier = email or phone number.
 *
 * <p>An account has two independent states (Requirement 7.1), and no other: e-mail confirmed or not
 * ({@code accountVerified}), and NFC not verified / verified / locked (a LegalProfile row, {@code nfcLockedUntil};
 * FR-04, D-21). The requirement has no admin lock of an account; FR-46 locks a seller, in vendor-service.
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.MEMBER;

    /**
     * E-mail confirmed with the OTP (FR-01). Until then the account cannot log in (FR-02), so it cannot buy or send
     * a request either (AC-01.2), and gets no password reset code (AC-02.1).
     */
    @Column(name = "account_verified", nullable = false)
    @Builder.Default
    private boolean accountVerified = false;

    /** Failed NFC card attempts since the last success or lockout (AC-04.9). */
    @Column(name = "nfc_failed_attempts", nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int nfcFailedAttempts = 0;

    /** NFC verification is locked until this moment; null = not locked. */
    @Column(name = "nfc_locked_until")
    private Instant nfcLockedUntil;

    /** Last password reset; tokens issued before it are refused. Null = never changed. */
    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    /**
     * False for a token issued before the last password change, so a reset ends every other session. JWT
     * {@code iat} has whole seconds, hence the truncation: a login in the same second as the reset still works.
     */
    public boolean acceptsTokenIssuedAt(Instant issuedAt) {
        return passwordChangedAt == null
                || (issuedAt != null && !issuedAt.isBefore(passwordChangedAt.truncatedTo(ChronoUnit.SECONDS)));
    }

    /**
     * The form {@code phone_number} is stored and looked up in: the 9 subscriber digits, so 0912…, 84912… and
     * +84912… are one account (AC-01.3). Null / blank stays null. The input must already match
     * {@link PhoneConstant#PATTERN}.
     */
    public static String storedPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.trim();
        return digits.substring(digits.length() - PhoneConstant.SUBSCRIBER_DIGITS);
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(SecurityConstant.ROLE_PREFIX + role.name()));
    }

    /** Spring Security refuses a login with DisabledException until the e-mail is confirmed. */
    @Override
    public boolean isEnabled() {
        return accountVerified;
    }
}
