package com.moonkage.catalog.inbox;

import com.moonkage.catalog.config.ProjectionRabbitConfig;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.service.ProjectionInboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

/** Captures only. ACK means inbox committed, not business projection completed. */
@Component
@Profile("!legacy-writer")
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "catalog.projections",
        name = "capture-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class ProjectionInboxConsumer {
    private final ProjectionInboxService inboxService;

    @RabbitListener(queues = ProjectionRabbitConfig.INBOX_QUEUE, concurrency = "2")
    public void capture(Message message) {
        try {
            inboxService.capture(message.getMessageProperties().getReceivedRoutingKey(), message.getBody());
        } catch (IllegalArgumentException | DataIntegrityViolationException | CatalogException exception) {
            throw new AmqpRejectAndDontRequeueException(
                    "Invalid projection envelope or conflicting event identity", exception);
        }
    }
}
