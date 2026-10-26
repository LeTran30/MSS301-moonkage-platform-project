package com.moonkage.catalog.scheduling;

import com.moonkage.catalog.config.CatalogOutboxProperties;
import com.moonkage.catalog.service.OutboxDeliveryService;
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

    @Scheduled(fixedDelayString = "${catalog.outbox.relay-interval:2s}")
    public void relay() {
        for (int index = 0; index < properties.getBatchSize(); index++) {
            if (!deliveryService.deliverNext()) {
                return;
            }
        }
    }
}
