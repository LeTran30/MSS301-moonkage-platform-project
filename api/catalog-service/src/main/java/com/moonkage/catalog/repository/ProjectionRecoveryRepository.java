package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.InboxEntry;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProjectionRecoveryRepository {
    List<InboxEntry> findPendingAfter(Instant receivedAt, String eventId, int limit);

    Optional<InboxEntry> lockEntry(String eventId);

    Optional<String> findProcessedRoutingKey(String eventId);

    List<String> findProductIdsAfter(String productId, int limit);
}
