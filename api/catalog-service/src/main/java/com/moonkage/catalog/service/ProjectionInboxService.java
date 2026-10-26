package com.moonkage.catalog.service;

import com.moonkage.catalog.entity.projection.InboxEntry;
import java.util.List;

public interface ProjectionInboxService {
    boolean capture(String routingKey, byte[] payload);

    List<InboxEntry> findPending(int limit);
}
