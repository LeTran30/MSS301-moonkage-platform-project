package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.LegacyLoginRecord;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Reads of the account module. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AccountQueries {

    private final AccountRepository accounts;

    Optional<AccountView> find(AccountId id) {
        return accounts.find(id).map(Account::view);
    }

    Optional<AccountView> findByEmail(Email email) {
        return accounts.findByEmail(email).map(Account::view);
    }

    /** Transitional (phase 5): the lookup the Spring Security login made before plan v2. */
    Optional<LegacyLoginRecord> findLoginRecord(String identifier) {
        Optional<Account> account = identifier.contains("@")
                ? accounts.findByEmail(Email.of(identifier))
                : PhoneNumber.isValid(identifier)
                        ? accounts.findByPhoneNumber(PhoneNumber.of(identifier))
                        : Optional.empty();
        return account.map(found ->
                new LegacyLoginRecord(found.view(), found.passwordHash().value()));
    }

    /** Transitional (phase 6). Throws NOT_FOUND, also for an id that is no UUID. */
    void requireExists(String accountId) {
        if (AccountId.tryParse(accountId).flatMap(accounts::find).isEmpty()) {
            throw AccountNotFound.of(accountId);
        }
    }
}
