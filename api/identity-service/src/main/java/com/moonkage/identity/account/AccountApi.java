package com.moonkage.identity.account;

import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import java.util.Optional;

/**
 * What other modules may ask of the account module (plan v2, 4.2). Commands join the caller's transaction. The
 * password never leaves the module: it comes in raw, and is hashed and checked here.
 */
public interface AccountApi {

    Optional<AccountView> find(AccountId id);

    Optional<AccountView> findByEmail(Email email);

    /**
     * FR-01: a MEMBER whose email is not confirmed yet; {@code phoneNumber} may be null. Throws EMAIL_ALREADY_EXISTS /
     * PHONE_ALREADY_EXISTS, also when a parallel registration takes the identifier first (AC-01.3).
     */
    AccountView registerMember(Email email, PhoneNumber phoneNumber, RawPassword password);

    /** FR-01: the OTP matched. Confirming again changes nothing. Throws NOT_FOUND. */
    AccountView confirmEmail(AccountId id);

    /** FR-02: tokens issued before this moment stop working (Q-04). Throws NOT_FOUND. */
    void changePassword(AccountId id, RawPassword newPassword);

    /**
     * FR-02: whether this identifier and password open a session. "Not activated" is told only after the password
     * matched, and an unknown identifier costs the same time as a wrong password, so neither reveals that an account
     * exists.
     */
    CredentialCheck verifyCredentials(LoginIdentifier identifier, RawPassword password);

    /**
     * Transitional, for the Spring Security login until phase 5 wires {@link #verifyCredentials} (ĐIỂM DỪNG E). Same
     * lookup as before: an identifier with '@' must be a valid email (INVALID_INPUT otherwise), any other text that
     * is no national phone number finds nothing.
     */
    Optional<LegacyLoginRecord> findLoginRecord(String identifier);

    /** Transitional until kyc is rebuilt (phase 6). Throws NOT_FOUND, also for an id that is no UUID. */
    void requireExists(String accountId);

    /**
     * Transitional until kyc and address are rebuilt (phases 6, 7): row lock on the account until the caller's
     * transaction ends, which serialises two requests setting a default address (FR-03) or submitting an NFC card
     * (FR-04). Throws NOT_FOUND, also for an id that is no UUID.
     */
    void lockForUpdate(String accountId);
}
