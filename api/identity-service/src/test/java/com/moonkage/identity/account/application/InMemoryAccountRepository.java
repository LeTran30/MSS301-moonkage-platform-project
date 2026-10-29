package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** The port with its unique keys, kept in a map: use case tests run without a database. */
final class InMemoryAccountRepository implements AccountRepository {

    private final Map<AccountId, Account> accounts = new ConcurrentHashMap<>();

    @Override
    public synchronized void add(Account account) {
        // the database's unique keys, which the port promises to report
        if (findByEmail(account.email()).isPresent()) {
            throw new AppException(
                    AccountError.EMAIL_ALREADY_EXISTS, account.email().value());
        }
        if (account.phoneNumber() != null
                && findByPhoneNumber(account.phoneNumber()).isPresent()) {
            throw new AppException(
                    AccountError.PHONE_ALREADY_EXISTS, account.phoneNumber().value());
        }
        accounts.put(account.id(), account);
    }

    @Override
    public Optional<Account> find(AccountId id) {
        return Optional.ofNullable(accounts.get(id));
    }

    @Override
    public Optional<Account> findByEmail(Email email) {
        return accounts.values().stream().filter(a -> a.email().equals(email)).findFirst();
    }

    @Override
    public Optional<Account> findByPhoneNumber(PhoneNumber phoneNumber) {
        return accounts.values().stream()
                .filter(a -> Objects.equals(a.phoneNumber(), phoneNumber))
                .findFirst();
    }

    @Override
    public boolean lock(AccountId id) {
        return accounts.containsKey(id);
    }

    int size() {
        return accounts.size();
    }
}
