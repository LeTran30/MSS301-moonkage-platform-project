package com.moonkage.identity.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class OutboxRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final OutboxEventRepository outboxEventRepository;

    @Autowired
    OutboxRepositoryIntegrationTest(OutboxEventRepository outboxEventRepository) {
        this.outboxEventRepository = outboxEventRepository;
    }

    @Test
    void outboxReturnsOnlyUnsentEventsOldestFirst() throws InterruptedException {
        outboxEventRepository.saveAndFlush(outbox("e-1", null));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-2", Instant.now()));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-3", null));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-4", null));

        List<OutboxEvent> batch =
                outboxEventRepository.findByPublishedAtIsNullOrderByCreatedAtAsc(PageRequest.of(0, 2));

        assertEquals(
                List.of("e-1", "e-3"), batch.stream().map(OutboxEvent::getId).toList());
    }

    private static OutboxEvent outbox(String id, Instant publishedAt) {
        return OutboxEvent.builder()
                .id(id)
                .routingKey("account.nfc_verified")
                .payload("{}")
                .publishedAt(publishedAt)
                .build();
    }
}
