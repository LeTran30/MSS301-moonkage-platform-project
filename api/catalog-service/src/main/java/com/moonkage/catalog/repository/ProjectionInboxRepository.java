package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.InboxEntry;
import java.util.List;

public interface ProjectionInboxRepository {
    boolean capture(String eventId, String routingKey, String payload);

    List<InboxEntry> findPending(int limit);
}
