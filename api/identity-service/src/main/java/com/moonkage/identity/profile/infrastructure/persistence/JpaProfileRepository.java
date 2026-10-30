package com.moonkage.identity.profile.infrastructure.persistence;

import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.application.port.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.application.port.ProfileRepository;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.stereotype.Repository;

/** Profiles in PostgreSQL. The id is the account's, so a new profile is persisted, never merged (plan v2, 5.5.5). */
@Repository
@RequiredArgsConstructor
class JpaProfileRepository implements ProfileRepository {

    private final EntityManager entityManager;

    @Override
    public void add(Profile profile) {
        entityManager.persist(profile);
    }

    @Override
    public Optional<Profile> find(AccountId id) {
        return Optional.ofNullable(entityManager.find(Profile.class, id.toString()));
    }

    @Override
    public Optional<Profile> findForUpdate(AccountId id) {
        return Optional.ofNullable(entityManager.find(Profile.class, id.toString(), LockModeType.PESSIMISTIC_WRITE));
    }

    @Override
    public boolean isIdNumberTaken(IdNumberHash hash) {
        return !entityManager
                .createQuery("SELECT p.accountId FROM Profile p WHERE p.idNumberHash = :hash", String.class)
                .setParameter("hash", hash)
                .setMaxResults(1)
                .getResultList()
                .isEmpty();
    }

    @Override
    public void flush() {
        try {
            entityManager.flush();
        } catch (PersistenceException exception) {
            if (Profile.ID_NUMBER_HASH_UNIQUE_KEY.equalsIgnoreCase(violatedKey(exception))) {
                throw new IdNumberTakenMeanwhile(exception);
            }
            throw exception;
        }
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
