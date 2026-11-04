package com.moonkage.catalog.scheduling;

import com.moonkage.catalog.config.CatalogOutboxProperties;
import com.moonkage.catalog.service.OutboxDeliveryService;
import com.moonkage.observability.OutboxMetrics;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "catalog.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CatalogOutboxRelay {
    private final OutboxDeliveryService deliveryService;
    private final CatalogOutboxProperties properties;
    private final OutboxMetrics outboxMetrics;

    @Scheduled(fixedDelayString = "${catalog.outbox.relay-interval:2s}")
    public void relay() {
        for (int index = 0; index < properties.getBatchSize(); index++) {
            if (!deliveryService.deliverNext()) {
                publishUnpublishedCount();
                return;
            }
        }
        publishUnpublishedCount();
    }

    /** BE-11b: the gauge that shows the relay is stuck before a customer asks about it. */
    private void publishUnpublishedCount() {
        outboxMetrics.setUnpublished(deliveryService.countUnpublished());
    }
}
