package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.dto.AccountCredentials;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads the account, asks the Account entity to change itself, saves. The rules live on Account. */
@Service
@RequiredArgsConstructor
class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public AccountView getAccount(String accountId) {
        return AccountMapper.toView(getEntity(accountId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountView> findAccount(String accountId) {
        return accountRepository.findById(accountId).map(AccountMapper::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountView> findByEmail(Email email) {
        return accountRepository.findByEmail(email).map(AccountMapper::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountCredentials> findCredentials(String loginIdentifier) {
        Optional<Account> account = loginIdentifier.contains("@")
                ? accountRepository.findByEmail(Email.of(loginIdentifier))
                : PhoneNumber.isValid(loginIdentifier)
                        ? accountRepository.findByPhoneNumber(PhoneNumber.of(loginIdentifier))
                        : Optional.empty();
        return account.map(AccountMapper::toCredentials);
    }

    @Override
    @Transactional(readOnly = true)
    public void requireAccountExists(String accountId) {
        if (!accountRepository.existsById(accountId)) {
            throw notFound(accountId);
        }
    }

    @Override
    @Transactional
    public AccountView createMember(Email email, PhoneNumber phoneNumber, PasswordHash passwordHash) {
        validateUniqueness(email, phoneNumber);
        Account account = Account.registerMember(email, phoneNumber, passwordHash);
        return AccountMapper.toView(saveNewAccount(account));
    }

    @Override
    @Transactional
    public AccountView confirmEmail(String accountId) {
        Account account = getEntity(accountId);
        account.confirmEmail();
        return AccountMapper.toView(account);
    }

    @Override
    @Transactional
    public void changePassword(String accountId, PasswordHash passwordHash) {
        getEntity(accountId).changePassword(passwordHash, Instant.now(clock));
    }

    @Override
    @Transactional
    public void lockForUpdate(String accountId) {
        if (accountRepository.findByIdForUpdate(accountId).isEmpty()) {
            throw notFound(accountId);
        }
    }

    private Account getEntity(String accountId) {
        return accountRepository.findById(accountId).orElseThrow(() -> notFound(accountId));
    }

    private static AppException notFound(String accountId) {
        return new AppException(LegacyError.ACCOUNT_NOT_FOUND, accountId);
    }

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    private void validateUniqueness(Email email, PhoneNumber phoneNumber) {
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(LegacyError.EMAIL_ALREADY_EXISTS, email.value());
        }
        if (phoneNumber != null && accountRepository.existsByPhoneNumber(phoneNumber)) {
            throw new AppException(LegacyError.PHONE_ALREADY_EXISTS, phoneNumber.value());
        }
    }

    /**
     * Flushed here so a duplicate that slipped past validateUniqueness (two registrations in the same instant) hits
     * the unique key inside this method and answers 409 like the pre-check, not 500 at commit (AC-01.3).
     */
    private Account saveNewAccount(Account account) {
        try {
            return accountRepository.saveAndFlush(account);
        } catch (DataIntegrityViolationException exception) {
            throw toDuplicateException(exception, account);
        }
    }

    /** The violated unique key tells which identifier was taken; any other violation stays as it is. */
    private static RuntimeException toDuplicateException(DataIntegrityViolationException exception, Account account) {
        String violatedKey =
                exception.getCause() instanceof ConstraintViolationException cause ? cause.getConstraintName() : null;
        if (Account.EMAIL_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(
                    LegacyError.EMAIL_ALREADY_EXISTS, account.getEmail().value());
        }
        if (Account.PHONE_NUMBER_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(
                    LegacyError.PHONE_ALREADY_EXISTS, account.getPhoneNumber().value());
        }
        return exception;
    }
}
