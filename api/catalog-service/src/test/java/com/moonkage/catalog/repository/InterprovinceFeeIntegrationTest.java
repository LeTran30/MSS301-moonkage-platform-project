package com.moonkage.catalog.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.dto.request.SaveInterprovinceFeesRequest;
import com.moonkage.catalog.entity.Province;
import com.moonkage.catalog.service.InterprovinceFeeService;
import com.moonkage.catalog.service.impl.InterprovinceFeeServiceImpl;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** JDBC slice runs all real migrations, but deliberately does not validate legacy product JPA entities. */
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = InterprovinceFeeIntegrationTest.Config.class)
@TestPropertySource(
        properties = {
            "spring.datasource.url=jdbc:postgresql://localhost/unused", "spring.datasource.username=test",
            "spring.datasource.password=test", "spring.flyway.locations=classpath:db/migration",
            "spring.flyway.baseline-on-migrate=false"
        })
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class InterprovinceFeeIntegrationTest {
    @MockitoSpyBean
    private JdbcOutboxEventRepository spyOutbox;

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final JdbcTemplate jdbc;
    private final InterprovinceFeeService service;
    private final InterprovinceFeeRepository feeRepository;
    private final OutboxEventRepository outboxRepository;
    private final PlatformTransactionManager transactionManager;

    @Autowired
    InterprovinceFeeIntegrationTest(
            JdbcTemplate jdbc,
            InterprovinceFeeService service,
            InterprovinceFeeRepository feeRepository,
            OutboxEventRepository outboxRepository,
            PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.service = service;
        this.feeRepository = feeRepository;
        this.outboxRepository = outboxRepository;
        this.transactionManager = transactionManager;
    }

    @BeforeEach
    void resetTables() {
        jdbc.update("DELETE FROM interprovince_fees");
        jdbc.update("DELETE FROM outbox_events");
    }

    @Test
    void provinceMigrationMatchesSharedReferenceExactly() {
        assertThat(feeRepository.findProvinces())
                .extracting(Province::code)
                .containsExactlyElementsOf(Arrays.stream(com.moonkage.reference.Province.values())
                        .map(com.moonkage.reference.Province::getCode)
                        .sorted()
                        .toList());
        assertThat(feeRepository.findProvinces()).hasSize(34);
    }

    @Test
    void savesFirstTableAndReplacementWithTransactionalAudit() {
        service.replace("admin", "ADMIN", request(45000));
        service.replace("admin", "ADMIN", request(0));
        assertThat(service.getTable().complete()).isTrue();
        assertThat(feeRepository.findFees())
                .hasSize(34)
                .allSatisfy(fee -> assertThat(fee.fee()).isZero());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE published_at IS NULL", Integer.class))
                .isEqualTo(2);
        assertThat(jdbc.queryForList("SELECT payload::jsonb ->> 'actorAccountId' FROM outbox_events", String.class))
                .containsOnly("admin");
    }

    @Test
    void rollbackKeepsNeitherFeesNorOutbox() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            service.replace("admin", "ADMIN", request(45000));
            assertThat(feeRepository.findFees()).hasSize(34);
            status.setRollbackOnly();
        });
        assertThat(feeRepository.findFees()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events", Integer.class))
                .isZero();
    }

    @Test
    void publishedRowsAreNotSelectedAgainAndFailuresRemainPending() {
        service.replace("admin", "ADMIN", request(45000));
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            var event = outboxRepository.lockNextUnpublished().orElseThrow();
            outboxRepository.recordFailure(event.id(), Instant.now());
            assertThat(outboxRepository.lockNextUnpublished().orElseThrow().attempts())
                    .isEqualTo(1);
            outboxRepository.markPublished(event.id(), Instant.now());
            assertThat(outboxRepository.lockNextUnpublished()).isEmpty();
        });
    }

    @Test
    void outboxInsertFailureRollsBackAllFeeWrites() {
        org.mockito.Mockito.doThrow(new org.springframework.dao.DataIntegrityViolationException("outbox test failure"))
                .when(spyOutbox)
                .save(org.mockito.ArgumentMatchers.any());
        assertThatThrownBy(() -> service.replace("admin", "ADMIN", request(45000)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(feeRepository.findFees()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events", Integer.class))
                .isZero();
    }

    @Test
    void concurrentFirstSavesSerializeOnExistingProvinceRows() throws Exception {
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch secondStarted = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first =
                    executor.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                        feeRepository.lockProvinces();
                        locked.countDown();
                        await(release);
                        service.replace("admin-one", "ADMIN", request(10000));
                    }));
            try {
                assertThat(locked.await(5, TimeUnit.SECONDS)).isTrue();
                var second = executor.submit(() -> {
                    secondStarted.countDown();
                    service.replace("admin-two", "ADMIN", request(20000));
                });
                assertThat(secondStarted.await(5, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> second.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
                release.countDown();
                first.get(5, TimeUnit.SECONDS);
                second.get(5, TimeUnit.SECONDS);
                assertThat(feeRepository.findFees()).hasSize(34).allSatisfy(fee -> {
                    assertThat(fee.fee()).isEqualTo(20000);
                    assertThat(fee.updatedBy()).isEqualTo("admin-two");
                });
            } finally {
                release.countDown();
            }
        }
    }

    private SaveInterprovinceFeesRequest request(long amount) {
        return new SaveInterprovinceFeesRequest(feeRepository.findProvinces().stream()
                .map(province -> new SaveInterprovinceFeesRequest.Fee(province.code(), amount))
                .toList());
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for test transaction");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    @Import({JdbcInterprovinceFeeRepository.class, JdbcOutboxEventRepository.class, InterprovinceFeeServiceImpl.class})
    static class Config {
        @Bean
        Clock testClock() {
            return Clock.systemUTC();
        }

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper().findAndRegisterModules();
        }
    }
}
