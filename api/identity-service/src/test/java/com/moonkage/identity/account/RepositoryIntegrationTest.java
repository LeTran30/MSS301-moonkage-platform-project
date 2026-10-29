package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.atom.PasswordHash;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.time.Instant;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.transaction.TestTransaction;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * What only the real database can show: unique keys, the custom queries and the row lock, on the same PostgreSQL
 * image as docker-compose. Skipped when Docker is not running.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class RepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final AccountRepository accountRepository;
    private final EntityManager entityManager;

    @Autowired
    RepositoryIntegrationTest(AccountRepository accountRepository, EntityManager entityManager) {
        this.accountRepository = accountRepository;
        this.entityManager = entityManager;
    }

    @Test
    void existsQueriesFindTakenEmailAndPhone() {
        accountRepository.saveAndFlush(account("lan@x.vn", "0912345678"));

        assertTrue(accountRepository.existsByEmail("lan@x.vn"));
        assertFalse(accountRepository.existsByEmail("other@x.vn"));
        assertTrue(accountRepository.existsByPhoneNumber("0912345678"));
        assertFalse(accountRepository.existsByPhoneNumber("0987654321"));
    }

    @Test
    void emailAndPhoneAreUniqueInTheDatabaseToo() {
        accountRepository.saveAndFlush(account("lan@x.vn", "0912345678"));

        DataIntegrityViolationException error = assertThrows(
                DataIntegrityViolationException.class, () -> accountRepository.saveAndFlush(account("lan@x.vn", null)));
        // AuthServiceImpl tells email from phone by this name
        assertEquals(Account.EMAIL_UNIQUE_KEY, violatedKey(error));
    }

    @Test
    void phoneOfAnotherAccountIsRefused() {
        accountRepository.saveAndFlush(account("lan@x.vn", "0912345678"));

        DataIntegrityViolationException error = assertThrows(
                DataIntegrityViolationException.class,
                () -> accountRepository.saveAndFlush(account("mai@x.vn", "0912345678")));
        assertEquals(Account.PHONE_NUMBER_UNIQUE_KEY, violatedKey(error));
    }

    private static String violatedKey(DataIntegrityViolationException error) {
        return ((ConstraintViolationException) error.getCause()).getConstraintName();
    }

    @Test
    void rowLockQueryRunsOnPostgres() {
        Account saved = accountRepository.saveAndFlush(account("lan@x.vn", null));

        // SELECT ... FOR UPDATE, used by addresses (FR-03) and the NFC attempt counter (FR-04)
        assertEquals(
                saved.getId(),
                accountRepository.findByIdForUpdate(saved.getId()).orElseThrow().getId());
    }

    @Test
    void newAccountGetsItsIdFromJpa() {
        Account account = account("lan@x.vn", null);

        Account saved = accountRepository.saveAndFlush(account);

        // persisted, not merged: the very same instance comes back, now with its id
        assertSame(account, saved);
        assertNotNull(saved.getId());
    }

    @Test
    void loadedAccountIsUpdatedNotInsertedAgain() {
        String id = accountRepository.saveAndFlush(account("lan@x.vn", null)).getId();
        entityManager.clear();

        Account loaded = accountRepository.findById(id).orElseThrow();
        loaded.changePassword(PasswordHash.of(AccountFixtures.PASSWORD_HASH), Instant.now());
        accountRepository.saveAndFlush(loaded);

        assertEquals(1, accountRepository.count());
    }

    @Test
    void databaseRefusesWhatTheEntityWouldNeverWrite() {
        // control: the same statement with valid values goes through, so a refusal below is the CHECK's doing
        assertEquals(1, insertRaw("lan@x.vn", "'912345678'"));
        TestTransaction.flagForRollback();
        TestTransaction.end();

        // each CHECK repeats a rule of Email or PhoneNumber (V2026_10_29_1500)
        assertRefused("mai@x.vn", "'0912345678'");
        assertRefused("mai@x.vn", "'123456789'");
        assertRefused("Mai@X.vn", "NULL");
    }

    /** One complete row per check: a failed statement aborts the transaction, so each runs in its own. */
    private void assertRefused(String email, String phoneSql) {
        TestTransaction.start();
        assertThrows(PersistenceException.class, () -> insertRaw(email, phoneSql));
        TestTransaction.flagForRollback();
        TestTransaction.end();
    }

    private int insertRaw(String email, String phoneSql) {
        return entityManager
                .createNativeQuery("INSERT INTO accounts (id, email, phone_number, password_hash, role,"
                        + " account_verified, created_at, updated_at)"
                        + " VALUES (gen_random_uuid()::text, ?1, " + phoneSql + ", ?2, 'MEMBER', true, now(), now())")
                .setParameter(1, email)
                .setParameter(2, AccountFixtures.PASSWORD_HASH)
                .executeUpdate();
    }

    private static Account account(String email, String phone) {
        return AccountFixtures.verifiedMember(email, phone);
    }
}
