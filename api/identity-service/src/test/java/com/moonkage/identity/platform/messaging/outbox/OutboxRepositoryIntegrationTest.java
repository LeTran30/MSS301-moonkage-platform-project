package com.moonkage.identity.platform.messaging.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;

import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@Import(OutboxEventRepository.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class OutboxRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final OutboxEventRepository outboxEventRepository;
    private final EntityManager entityManager;

    @Autowired
    OutboxRepositoryIntegrationTest(OutboxEventRepository outboxEventRepository, EntityManager entityManager) {
        this.outboxEventRepository = outboxEventRepository;
        this.entityManager = entityManager;
    }

    @Test
    void outboxReturnsOnlyUnsentEventsOldestFirst() throws InterruptedException {
        add(1, false);
        Thread.sleep(5);
        add(2, true);
        Thread.sleep(5);
        add(3, false);
        Thread.sleep(5);
        add(4, false);
        entityManager.clear();

        List<OutboxEvent> batch = outboxEventRepository.findUnpublished(2);

        assertEquals(
                List.of(id(1), id(3)), batch.stream().map(OutboxEvent::getId).toList());
    }

    private void add(long n, boolean published) {
        OutboxEvent event = OutboxEvent.record(new EventId(new UUID(0, n)), "account.kyc_verified", "{}");
        if (published) {
            event.markPublished(Instant.parse("2026-10-29T08:00:00Z"));
        }
        outboxEventRepository.add(event);
        entityManager.flush();
    }

    private static String id(long n) {
        return new UUID(0, n).toString();
    }
}
