package com.moonkage.identity.account.application.port;

import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import java.util.Optional;

/** Where accounts are kept. A loaded account is saved by its transaction; there is no {@code save}. */
public interface AccountRepository {

    /**
     * A new account, whose id was given before. Written at once, so a duplicate that slipped past the use case's check
     * (two registrations in the same instant) fails here with EMAIL_ALREADY_EXISTS / PHONE_ALREADY_EXISTS, not at
     * commit (AC-01.3).
     */
    void add(Account account);

    Optional<Account> find(AccountId id);

    Optional<Account> findByEmail(Email email);

    Optional<Account> findByPhoneNumber(PhoneNumber phoneNumber);
}
