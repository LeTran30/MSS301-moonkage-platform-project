package com.moonkage.identity.account;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.account.vo.PasswordHash;
import com.moonkage.identity.account.vo.PhoneNumber;
import com.moonkage.identity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Login credentials (FR-01, FR-02). Login identifier = email or phone number. Package-private: other components see
 * an {@link AccountView} through {@link AccountService}.
 */
@Entity
@Table(
        name = "accounts",
        uniqueConstraints = {
            @UniqueConstraint(name = Account.EMAIL_UNIQUE_KEY, columnNames = "email"),
            @UniqueConstraint(name = Account.PHONE_NUMBER_UNIQUE_KEY, columnNames = "phone_number")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class Account extends BaseEntity {

    static final String EMAIL_UNIQUE_KEY = "uk_accounts_email";
    static final String PHONE_NUMBER_UNIQUE_KEY = "uk_accounts_phone_number";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "email", nullable = false)
    private Email email;

    @Column(name = "phone_number", length = 20)
    private PhoneNumber phoneNumber;

    @Column(name = "password_hash", nullable = false)
    private PasswordHash passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.MEMBER;

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

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    public void setEmail(Email email) {
        this.email = email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : Email.of(email);
    }

    public Email email() {
        return email;
    }

    public String getEmail() {
        return email == null ? null : email.value();
    }

    public void setPhoneNumber(PhoneNumber phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = (phoneNumber == null || phoneNumber.isBlank()) ? null : PhoneNumber.of(phoneNumber);
    }

    public PhoneNumber phoneNumber() {
        return phoneNumber;
    }

    /** The 9 subscriber digits, as stored and as the API returns them (frontend adds the 0). */
    public String getPhoneNumber() {
        return phoneNumber == null ? null : phoneNumber.value();
    }

    public void setPasswordHash(PasswordHash passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash == null ? null : PasswordHash.of(passwordHash);
    }

    public PasswordHash passwordHash() {
        return passwordHash;
    }

    public String getPasswordHash() {
        return passwordHash == null ? null : passwordHash.hash();
    }

    public NfcLockout getNfcLockout() {
        return new NfcLockout(nfcFailedAttempts, nfcLockedUntil);
    }

    public void setNfcLockout(NfcLockout lockout) {
        this.nfcFailedAttempts = lockout.failedAttempts();
        this.nfcLockedUntil = lockout.lockedUntil();
    }

    public static class AccountBuilder {
        public AccountBuilder email(String email) {
            this.email = email == null ? null : Email.of(email);
            return this;
        }

        public AccountBuilder email(Email email) {
            this.email = email;
            return this;
        }

        public AccountBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = (phoneNumber == null || phoneNumber.isBlank()) ? null : PhoneNumber.of(phoneNumber);
            return this;
        }

        public AccountBuilder phoneNumber(PhoneNumber phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public AccountBuilder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash == null ? null : PasswordHash.of(passwordHash);
            return this;
        }

        public AccountBuilder passwordHash(PasswordHash passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }
    }
}
