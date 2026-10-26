package com.moonkage.identity.account;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.account.vo.PasswordHash;
import com.moonkage.identity.account.vo.PhoneNumber;
import java.util.Optional;

/**
 * Public API of the account component: the only way other components read or change an account. Methods that change
 * state join the caller's transaction.
 */
public interface AccountService {

    /** GET /api/accounts/me: the account plus its display name. */
    AccountResponse getMyAccount(String accountId);

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

    AccountView markVerified(String accountId);

    /** Tokens issued before this moment stop working (Q-04). */
    void changePassword(String accountId, PasswordHash passwordHash);

    /**
     * Row lock on the account until the caller's transaction ends: serialises the changes of one account, e.g. two
     * requests setting a default address (FR-03) or two NFC card submits (FR-04). Throws ACCOUNT_NOT_FOUND.
     */
    void lockForUpdate(String accountId);

    /** Throws ACCOUNT_NOT_FOUND. */
    NfcLockout getNfcLockout(String accountId);

    void saveNfcLockout(String accountId, NfcLockout lockout);
}
