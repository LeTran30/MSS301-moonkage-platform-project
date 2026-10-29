package com.moonkage.identity.account.application;

import com.moonkage.identity.account.CredentialCheck;
import com.moonkage.identity.account.LoginIdentifier;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.application.port.PasswordHasher;
import com.moonkage.identity.account.domain.Account;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-02: whether an identifier and a password open a session. Four ways out:
 *
 * <ol>
 *   <li>no such account: a dummy hash check, then Rejected, so the reply takes as long as for a wrong password;
 *   <li>wrong password: Rejected;
 *   <li>right password, email not confirmed: NotActivated, told only now that the password proved who is asking;
 *   <li>right password, email confirmed: Accepted.
 * </ol>
 */
@Service
@RequiredArgsConstructor
class VerifyCredentials {

    private final AccountRepository accounts;
    private final PasswordHasher passwordHasher;

    @Transactional(readOnly = true)
    CredentialCheck handle(LoginIdentifier identifier, RawPassword password) {
        Optional<Account> found = find(identifier);
        if (found.isEmpty()) {
            passwordHasher.dummyMatch(password);
            return new CredentialCheck.Rejected();
        }
        Account account = found.get();
        if (!passwordHasher.matches(password, account.passwordHash())) {
            return new CredentialCheck.Rejected();
        }
        return account.verified() ? new CredentialCheck.Accepted(account.view()) : new CredentialCheck.NotActivated();
    }

    private Optional<Account> find(LoginIdentifier identifier) {
        return switch (identifier) {
            case LoginIdentifier.ByEmail byEmail -> accounts.findByEmail(byEmail.email());
            case LoginIdentifier.ByPhoneNumber byPhoneNumber -> accounts.findByPhoneNumber(byPhoneNumber.phoneNumber());
        };
    }
}
