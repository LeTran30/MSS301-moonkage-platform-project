package com.moonkage.identity.account.domain;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.platform.persistence.BaseEntity;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * How a person gets into the platform: login identifiers, password, role (FR-01, FR-02; plan v2, 4.2). Created only by
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
public class Account extends BaseEntity {

    public static final String EMAIL_UNIQUE_KEY = "uk_accounts_email";
    public static final String PHONE_NUMBER_UNIQUE_KEY = "uk_accounts_phone_number";

    /** The {@link AccountId}. */
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "email", nullable = false, updatable = false)
    private Email email;

    /** Stored as the 9 subscriber digits; null when not given. */
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

    /** For JPA only. */
    protected Account() {}

    private Account(AccountId id, Email email, PhoneNumber phoneNumber, PasswordHash passwordHash, Role role) {
        this.id = Objects.requireNonNull(id, "id").value();
        this.email = Objects.requireNonNull(email, "email");
        this.phoneNumber = phoneNumber;
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
        this.role = role;
        this.accountVerified = false;
    }

    /**
     * FR-01: a MEMBER whose email is not confirmed yet. The id comes from IdGenerator; uniqueness of email and phone
     * is checked by the use case and by the database.
     */
    public static Account registerMember(
            AccountId id, Email email, PhoneNumber phoneNumber, PasswordHash passwordHash) {
        return new Account(id, email, phoneNumber, passwordHash, Role.MEMBER);
    }

    /** FR-01: the OTP matched. Confirming again changes nothing. */
    public void confirmEmail() {
        this.accountVerified = true;
    }

    /** FR-02: tokens issued before {@code now} stop working (Q-04). */
    public void changePassword(PasswordHash newPasswordHash, Instant now) {
        // both checked before either is written: a refused change leaves the account as it was
        PasswordHash checkedHash = Objects.requireNonNull(newPasswordHash, "passwordHash");
        Instant changedAt = Objects.requireNonNull(now, "passwordChangedAt");
        this.passwordHash = checkedHash;
        this.passwordChangedAt = changedAt;
    }

    public AccountId id() {
        return new AccountId(id);
    }

    public Email email() {
        return email;
    }

    /** Null when not given. */
    public PhoneNumber phoneNumber() {
        return phoneNumber;
    }

    public PasswordHash passwordHash() {
        return passwordHash;
    }

    public Role role() {
        return role;
    }

    public boolean verified() {
        return accountVerified;
    }

    /** Null until the first change. */
    public Instant passwordChangedAt() {
        return passwordChangedAt;
    }

    /** What other modules see of this account. */
    public AccountView view() {
        return new AccountView(id(), email, phoneNumber, role, accountVerified, passwordChangedAt);
    }
}
