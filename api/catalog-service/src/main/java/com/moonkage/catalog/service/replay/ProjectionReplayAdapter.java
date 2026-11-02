package com.moonkage.catalog.service.replay;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.enums.ProjectionOutcome;

/**
 * Turns one stored inbox event of its routing key into a projection call. One adapter per key; the wire shapes are
 * those of docs/services/catalog/contract-proposal.md.
 */
public interface ProjectionReplayAdapter {
    String routingKey();

    /** Must apply through CatalogProjectionService using the stored eventId, in the caller's transaction. */
    ProjectionOutcome apply(InboxEntry storedEvent);
}
