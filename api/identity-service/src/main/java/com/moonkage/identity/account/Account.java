package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.platform.persistence.BaseEntity;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
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
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * How a person gets into the platform: login identifiers, password, role (FR-01, FR-02; docs/services/identity/
 * db-identify.md). Package-private: other components see an {@link AccountView} through {@link AccountService}.
 *
 * <p>Keeps its own fields right (docs/services/identity/domain-model-plan.md, Account): created only by
 * {@link #registerMember}, changed only by the named methods below. Email, phone number and role never change; no
 * code path creates an ADMIN (admins come from the seed).
 */
@Entity
@Table(
        name = "accounts",
        uniqueConstraints = {
            @UniqueConstraint(name = Account.EMAIL_UNIQUE_KEY, columnNames = "email"),
            @UniqueConstraint(name = Account.PHONE_NUMBER_UNIQUE_KEY, columnNames = "phone_number")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Account extends BaseEntity {

    static final String EMAIL_UNIQUE_KEY = "uk_accounts_email";
    static final String PHONE_NUMBER_UNIQUE_KEY = "uk_accounts_phone_number";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "email", nullable = false, updatable = false)
    private Email email;

    /** The 9 subscriber digits, as stored and as the API returns them (frontend adds the 0); null when not given. */
    @Column(name = "phone_number", length = PhoneNumber.SUBSCRIBER_DIGITS, updatable = false)
    private PhoneNumber phoneNumber;

    @Column(name = "password_hash", nullable = false)
    private PasswordHash passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = Role.MAX_NAME_LENGTH, updatable = false)
    private Role role;

    /** Email confirmed by OTP (FR-01); only goes from false to true. */
    @Column(name = "account_verified", nullable = false)
    private boolean accountVerified;

    /** Null until the first change; tokens issued before it stop working (Q-04). */
    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    private Account(Email email, PhoneNumber phoneNumber, PasswordHash passwordHash, Role role) {
        this.email = Objects.requireNonNull(email, "email");
        this.phoneNumber = phoneNumber;
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
        this.role = role;
        this.accountVerified = false;
    }

    /** FR-01: a MEMBER whose email is not confirmed yet. Uniqueness of email and phone is the service's check. */
    static Account registerMember(Email email, PhoneNumber phoneNumber, PasswordHash passwordHash) {
        return new Account(email, phoneNumber, passwordHash, Role.MEMBER);
    }

    /** FR-01: the OTP matched. Confirming again changes nothing. */
    void confirmEmail() {
        this.accountVerified = true;
    }

    /** FR-02: tokens issued before {@code now} stop working (Q-04). */
    void changePassword(PasswordHash newPasswordHash, Instant now) {
        // both checked before either is written: a refused change leaves the account as it was
        PasswordHash checkedHash = Objects.requireNonNull(newPasswordHash, "passwordHash");
        Instant changedAt = Objects.requireNonNull(now, "passwordChangedAt");
        this.passwordHash = checkedHash;
        this.passwordChangedAt = changedAt;
    }
}
