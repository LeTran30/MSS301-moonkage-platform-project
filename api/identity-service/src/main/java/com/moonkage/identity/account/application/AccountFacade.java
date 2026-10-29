package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.CredentialCheck;
import com.moonkage.identity.account.LegacyLoginRecord;
import com.moonkage.identity.account.LoginIdentifier;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The module's one door for other modules: each call goes to its use case or to the queries. */
@Service
@RequiredArgsConstructor
class AccountFacade implements AccountApi {

    private final AccountQueries queries;
    private final RegisterMember registerMember;
    private final ConfirmEmail confirmEmail;
    private final ChangePassword changePassword;
    private final VerifyCredentials verifyCredentials;
    private final AccountRepository accounts;

    @Override
    public Optional<AccountView> find(AccountId id) {
        return queries.find(id);
    }

    @Override
    public Optional<AccountView> findByEmail(Email email) {
        return queries.findByEmail(email);
    }

    @Override
    public AccountView registerMember(Email email, PhoneNumber phoneNumber, RawPassword password) {
        return registerMember.handle(email, phoneNumber, password);
    }

    @Override
    public AccountView confirmEmail(AccountId id) {
        return confirmEmail.handle(id);
    }

    @Override
    public void changePassword(AccountId id, RawPassword newPassword) {
        changePassword.handle(id, newPassword);
    }

    @Override
    public CredentialCheck verifyCredentials(LoginIdentifier identifier, RawPassword password) {
        return verifyCredentials.handle(identifier, password);
    }

    @Override
    public Optional<LegacyLoginRecord> findLoginRecord(String identifier) {
        return queries.findLoginRecord(identifier);
    }

    @Override
    public void requireExists(String accountId) {
        queries.requireExists(accountId);
    }

    @Override
    @Transactional
    public void lockForUpdate(String accountId) {
        if (!AccountId.tryParse(accountId).map(accounts::lock).orElse(false)) {
            throw AccountNotFound.of(accountId);
        }
    }
}
