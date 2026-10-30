package com.moonkage.identity.account.infrastructure.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountFixtures;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.account.domain.PasswordHash;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.transaction.TestTransaction;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * What only the real database can show: unique keys and their translation, the queries over converted columns, the
 * row lock and the CHECKs, on the same PostgreSQL image as docker-compose. Skipped when Docker is not running.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
@Import(JpaAccountRepository.class)
class JpaAccountRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String V7_ID = "0192f3a0-7c00-7abc-8def-0123456789ab";
    private static final String V4_ID = "00000000-0000-4000-8000-0001000000ff";

    private final JpaAccountRepository repository;
    private final EntityManager entityManager;

    @Autowired
    JpaAccountRepositoryIntegrationTest(JpaAccountRepository repository, EntityManager entityManager) {
        this.repository = repository;
        this.entityManager = entityManager;
    }

    @Test
    void newAccountIsPersistedWithTheIdItWasGiven() {
        Account account = AccountFixtures.verifiedMember("lan@x.vn", "0912345678");
        AccountId id = account.id();

        repository.add(account);
        entityManager.clear();

        Account loaded = repository.find(id).orElseThrow();
        assertNotSame(account, loaded);
        assertEquals(id, loaded.id());
        assertEquals(account.view(), loaded.view());
    }

    @Test
    void idsOfEveryUuidVersionAreStoredAsUuidAndReadBack() {
        // new accounts get v7 ids; the seeded ones were written as v4 text before the column became uuid
        AccountId v7 = AccountId.tryParse(V7_ID).orElseThrow();
        repository.add(Account.registerMember(
                v7, Email.parse("v7@x.vn"), null, new PasswordHash(AccountFixtures.PASSWORD_HASH)));
        entityManager
                .createNativeQuery("INSERT INTO accounts (id, email, password_hash, role, account_verified,"
                        + " created_at, updated_at)"
                        + " VALUES (CAST(?1 AS uuid), 'v4@x.vn', ?2, 'MEMBER', true, now(), now())")
                .setParameter(1, V4_ID)
                .setParameter(2, AccountFixtures.PASSWORD_HASH)
                .executeUpdate();
        entityManager.clear();

        assertEquals(v7, repository.find(v7).orElseThrow().id());
        assertEquals(
                V4_ID,
                repository
                        .find(AccountId.tryParse(V4_ID).orElseThrow())
                        .orElseThrow()
                        .id()
                        .toString());
        assertEquals(
                "uuid",
                entityManager
                        .createNativeQuery("SELECT data_type FROM information_schema.columns"
                                + " WHERE table_name = 'accounts' AND column_name = 'id'")
                        .getSingleResult());
    }

    @Test
    void findsByEmailAndByPhoneNumber() {
        Account account = AccountFixtures.verifiedMember("lan@x.vn", "0912345678");
        repository.add(account);

        assertSame(account, repository.findByEmail(Email.parse("lan@x.vn")).orElseThrow());
        assertSame(
                account,
                repository.findByPhoneNumber(PhoneNumber.parse("0912345678")).orElseThrow());
        assertTrue(repository.findByEmail(Email.parse("mai@x.vn")).isEmpty());
        assertTrue(repository.findByPhoneNumber(PhoneNumber.parse("0987654321")).isEmpty());
    }

    @Test
    void takenEmailFailsInAddWith409NotAtCommit() {
        repository.add(AccountFixtures.verifiedMember("lan@x.vn", "0912345678"));

        AppException error =
                assertThrows(AppException.class, () -> repository.add(AccountFixtures.member("lan@x.vn", null)));
        assertEquals(AccountError.EMAIL_ALREADY_EXISTS, error.getErrorCode());
    }

    @Test
    void takenPhoneNumberFailsInAddWith409NotAtCommit() {
        repository.add(AccountFixtures.verifiedMember("lan@x.vn", "0912345678"));

        AppException error = assertThrows(
                AppException.class, () -> repository.add(AccountFixtures.member("mai@x.vn", "0912345678")));
        assertEquals(AccountError.PHONE_ALREADY_EXISTS, error.getErrorCode());
    }

    @Test
    void loadedAccountIsUpdatedByItsTransactionNotInsertedAgain() {
        Account account = AccountFixtures.verifiedMember("lan@x.vn", null);
        repository.add(account);
        entityManager.clear();

        Instant changedAt = Instant.parse("2026-10-29T08:00:00Z");
        repository.find(account.id()).orElseThrow().changePassword(new PasswordHash("new-hash"), changedAt);
        entityManager.flush();
        entityManager.clear();

        assertEquals(
                1L, entityManager.createQuery("SELECT count(a) FROM Account a").getSingleResult());
        assertEquals(changedAt, repository.find(account.id()).orElseThrow().passwordChangedAt());
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
                        + " VALUES (gen_random_uuid(), ?1, " + phoneSql + ", ?2, 'MEMBER', true, now(), now())")
                .setParameter(1, email)
                .setParameter(2, AccountFixtures.PASSWORD_HASH)
                .executeUpdate();
    }
}
