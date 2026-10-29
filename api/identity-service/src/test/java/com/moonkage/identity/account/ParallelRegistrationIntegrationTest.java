package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.id.IdGenerator;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * AC-01.3 on the real database: registrations racing for one email or phone number all pass the use case's check,
 * so only the unique key can stop them. Every loser must still get 409, not 500 at commit. Each call runs in its own
 * transaction, as two HTTP requests would.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import(ParallelRegistrationIntegrationTest.AccountModule.class)
class ParallelRegistrationIntegrationTest {

    private static final int THREADS = 8;

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    @ComponentScan("com.moonkage.identity.account")
    static class AccountModule {

        @Bean
        Clock clock() {
            return Clock.systemUTC();
        }

        @Bean
        IdGenerator idGenerator() {
            return new SequentialIdGenerator();
        }
    }

    private final AccountApi accountApi;
    private final EntityManager entityManager;
    private final TransactionTemplate transaction;

    @Autowired
    ParallelRegistrationIntegrationTest(
            AccountApi accountApi, EntityManager entityManager, TransactionTemplate transaction) {
        this.accountApi = accountApi;
        this.entityManager = entityManager;
        this.transaction = transaction;
    }

    @AfterEach
    void removeTheAccounts() {
        transaction.executeWithoutResult(status -> entityManager
                .createNativeQuery("DELETE FROM accounts WHERE email LIKE '%@race.vn'")
                .executeUpdate());
    }

    @Test
    void oneEmailRegisteredInParallelLetsExactlyOneThrough() throws Exception {
        List<Object> outcomes = runInParallel(
                i -> accountApi.registerMember(Email.parse("lan@race.vn"), null, RawPassword.parse("secret-123")));

        assertWinnerAndLosers(outcomes, AccountError.EMAIL_ALREADY_EXISTS);
    }

    @Test
    void onePhoneNumberRegisteredInParallelLetsExactlyOneThrough() throws Exception {
        List<Object> outcomes = runInParallel(i -> accountApi.registerMember(
                Email.parse("user" + i + "@race.vn"),
                PhoneNumber.parse("0912345678"),
                RawPassword.parse("secret-123")));

        assertWinnerAndLosers(outcomes, AccountError.PHONE_ALREADY_EXISTS);
    }

    private static void assertWinnerAndLosers(List<Object> outcomes, AccountError loserError) {
        assertEquals(1, outcomes.stream().filter(AccountView.class::isInstance).count(), outcomes::toString);
        assertEquals(THREADS - 1, outcomes.stream().filter(loserError::equals).count(), outcomes::toString);
    }

    /** Starts every task at once; each outcome is the AccountView or the error code it failed with. */
    private static List<Object> runInParallel(Registration registration) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (int i = 0; i < THREADS; i++) {
                int index = i;
                Callable<Object> task = () -> {
                    start.await();
                    try {
                        return registration.register(index);
                    } catch (AppException e) {
                        return e.getErrorCode();
                    }
                };
                futures.add(pool.submit(task));
            }
            start.countDown();
            List<Object> outcomes = new ArrayList<>();
            for (Future<Object> future : futures) {
                outcomes.add(future.get(30, TimeUnit.SECONDS));
            }
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }

    @FunctionalInterface
    private interface Registration {
        AccountView register(int index);
    }
}
