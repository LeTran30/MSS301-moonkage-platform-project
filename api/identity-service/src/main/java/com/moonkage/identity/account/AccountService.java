package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.account.dto.AccountCredentials;
import com.moonkage.identity.account.dto.AccountView;
import java.util.Optional;

/**
 * Public API of the account component: the only way other components read or change an account. Methods that change
 * state join the caller's transaction. An account id that is not a UUID answers like an unknown account.
 */
public interface AccountService {

    /** Throws ACCOUNT_NOT_FOUND. */
    AccountView getAccount(String accountId);

    Optional<AccountView> findAccount(String accountId);

    Optional<AccountView> findByEmail(Email email);

    /** FR-02: the identifier is an email or a phone number in any accepted form; empty when neither matches. */
    Optional<AccountCredentials> findCredentials(String loginIdentifier);

    /** Throws ACCOUNT_NOT_FOUND. */
    void requireAccountExists(String accountId);

    /**
     * A MEMBER whose email is not confirmed yet (FR-01). Throws EMAIL_ALREADY_EXISTS / PHONE_ALREADY_EXISTS, also
     * when a parallel registration takes the identifier first (AC-01.3).
     */
    AccountView createMember(Email email, PhoneNumber phoneNumber, PasswordHash passwordHash);

    /** FR-01: the OTP matched. Throws ACCOUNT_NOT_FOUND. */
    AccountView confirmEmail(String accountId);

    /** Tokens issued before this moment stop working (Q-04). */
    void changePassword(String accountId, PasswordHash passwordHash);

    /**
     * Row lock on the account until the caller's transaction ends: serialises the changes of one account, e.g. two
     * requests setting a default address (FR-03) or two NFC card submits (FR-04). Throws ACCOUNT_NOT_FOUND.
     */
    void lockForUpdate(String accountId);
}
