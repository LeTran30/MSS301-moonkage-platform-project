package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
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
}
