package com.moonkage.identity.account.infrastructure.persistence;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.stereotype.Repository;

/**
 * Accounts in PostgreSQL. The id is given before saving, so a new account is persisted, never merged (plan v2,
 * 5.5.5).
 */
@Repository
@RequiredArgsConstructor
class JpaAccountRepository implements AccountRepository {

    private final EntityManager entityManager;

    @Override
    public void add(Account account) {
        try {
            entityManager.persist(account);
            entityManager.flush();
        } catch (PersistenceException exception) {
            throw duplicateOf(account, exception);
        }
    }

    @Override
    public Optional<Account> find(AccountId id) {
        return Optional.ofNullable(entityManager.find(Account.class, id.toString()));
    }

    @Override
    public Optional<Account> findByEmail(Email email) {
        return entityManager
                .createQuery("SELECT a FROM Account a WHERE a.email = :email", Account.class)
                .setParameter("email", email)
                .getResultStream()
                .findFirst();
    }

    @Override
    public Optional<Account> findByPhoneNumber(PhoneNumber phoneNumber) {
        return entityManager
                .createQuery("SELECT a FROM Account a WHERE a.phoneNumber = :phoneNumber", Account.class)
                .setParameter("phoneNumber", phoneNumber)
                .getResultStream()
                .findFirst();
    }

    /** The violated unique key tells which identifier was taken; any other failure stays as it is. */
    private static RuntimeException duplicateOf(Account account, PersistenceException exception) {
        String violatedKey = violatedKey(exception);
        if (Account.EMAIL_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(
                    AccountError.EMAIL_ALREADY_EXISTS, account.email().value());
        }
        if (Account.PHONE_NUMBER_UNIQUE_KEY.equalsIgnoreCase(violatedKey)) {
            return new AppException(
                    AccountError.PHONE_ALREADY_EXISTS, account.phoneNumber().value());
        }
        return exception;
    }

    /** Hibernate may wrap its ConstraintViolationException, so the whole cause chain is searched. */
    private static String violatedKey(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException violation) {
                return violation.getConstraintName();
            }
        }
        return null;
    }
}
