package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-01: the registration OTP matched. */
@Service
@RequiredArgsConstructor
class ConfirmEmail {

    private final AccountRepository accounts;

    /** Throws NOT_FOUND. */
    @Transactional
    AccountView handle(AccountId id) {
        Account account = accounts.find(id).orElseThrow(() -> AccountNotFound.of(id));
        account.confirmEmail();
        return account.view();
    }
}
