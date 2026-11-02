package com.moonkage.catalog.scheduling;

import com.moonkage.catalog.config.CatalogProjectionProperties;
import com.moonkage.catalog.dto.replay.ReplayCheckpoint;
import com.moonkage.catalog.service.ProjectionRecoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Applies the events the inbox captured but no adapter applied yet (absent from processed_events) to product_views,
 * vendor_snapshots and product_reviews. Order of arrival does not matter: the projection gates every state by its
 * sourceVersion. Each run starts from the beginning, so an entry committed behind an earlier scan is still found.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "catalog.projections",
        name = "apply-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class PendingInboxProjector {
    private final ProjectionRecoveryService recoveryService;
    private final CatalogProjectionProperties properties;

    @Scheduled(fixedDelayString = "${catalog.projections.apply-interval:1s}")
    public void applyPending() {
        ReplayCheckpoint position = null;
        for (int page = 0; page < properties.getApplyMaxPages(); page++) {
            var batch = recoveryService.replayPending(position, properties.getApplyBatchSize());
            if (!batch.hasMore()) {
                return;
            }
            position = batch.nextScanPosition();
        }
    }
}
