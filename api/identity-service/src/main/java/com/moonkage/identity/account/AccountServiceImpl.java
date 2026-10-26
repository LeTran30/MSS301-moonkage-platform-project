package com.moonkage.identity.account;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.account.vo.PasswordHash;
import com.moonkage.identity.account.vo.PhoneNumber;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import com.moonkage.identity.profile.UserProfileService;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserProfileService userProfileService;

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getMyAccount(String accountId) {
        Account account = getEntity(accountId);
        return AccountMapper.toAccountResponse(account, userProfileService.getFullName(accountId));
    }

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
            throw new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId);
        }
    }

    @Override
    @Transactional
    public AccountView createMember(Email email, PhoneNumber phoneNumber, PasswordHash passwordHash) {
        validateUniqueness(email, phoneNumber);
        Account account = Account.builder()
                .email(email)
                .phoneNumber(phoneNumber)
                .passwordHash(passwordHash)
                .accountVerified(false)
                .role(Role.MEMBER)
                .build();
        return AccountMapper.toView(saveNewAccount(account));
    }

    @Override
    @Transactional
    public AccountView markVerified(String accountId) {
        Account account = getEntity(accountId);
        account.setAccountVerified(true);
        return AccountMapper.toView(account);
    }

    @Override
    @Transactional
    public void changePassword(String accountId, PasswordHash passwordHash) {
        Account account = getEntity(accountId);
        account.setPasswordHash(passwordHash);
        account.setPasswordChangedAt(Instant.now());
    }

    @Override
    @Transactional
    public void lockForUpdate(String accountId) {
        if (accountRepository.findByIdForUpdate(accountId).isEmpty()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public NfcLockout getNfcLockout(String accountId) {
        return getEntity(accountId).getNfcLockout();
    }

    @Override
    @Transactional
    public void saveNfcLockout(String accountId, NfcLockout lockout) {
        getEntity(accountId).setNfcLockout(lockout);
    }

    private Account getEntity(String accountId) {
        return accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
    }

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    private void validateUniqueness(Email email, PhoneNumber phoneNumber) {
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, email.value());
        }
        if (phoneNumber != null && accountRepository.existsByPhoneNumber(phoneNumber)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, phoneNumber.value());
        }
    }

    /**
     * Flushed here so a duplicate that slipped past validateUniqueness (two registrations in the same instant) hits
     * the unique key inside this method and answers 409 like the pre-check, not 500 at commit (AC-01.3).
     */
    private Account saveNewAccount(Account account) {
        try {
            return accountRepository.saveAndFlush(account);
        } catch (DataIntegrityViolationException e) {
            throw toDuplicateException(e, account);
        }
    }

    /** The violated unique key tells which identifier was taken; any other violation stays as it is. */
    private static RuntimeException toDuplicateException(DataIntegrityViolationException e, Account account) {
        String violatedKey =
                e.getCause() instanceof ConstraintViolationException cause ? cause.getConstraintName() : null;
        if (Account.EMAIL_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, account.getEmail());
        }
        if (Account.PHONE_NUMBER_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(ErrorCode.PHONE_ALREADY_EXISTS, account.getPhoneNumber());
        }
        return e;
    }
}
