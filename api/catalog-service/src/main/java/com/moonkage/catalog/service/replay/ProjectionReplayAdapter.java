package com.moonkage.catalog.service.replay;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.enums.ProjectionOutcome;

/** Extension port only. No production implementations until the group approves the producer contract. */
public interface ProjectionReplayAdapter {
    String routingKey();

    /** Must apply through CatalogProjectionService using the stored eventId, in the caller's transaction. */
    ProjectionOutcome apply(InboxEntry storedEvent);
}
