package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
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

    @Autowired
    RepositoryIntegrationTest(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
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

    private static Account account(String email, String phone) {
        return Account.builder()
                .email(email)
                .phoneNumber(phone)
                .passwordHash(AccountFixtures.PASSWORD_HASH)
                .accountVerified(true)
                .role(Role.MEMBER)
                .build();
    }
}
