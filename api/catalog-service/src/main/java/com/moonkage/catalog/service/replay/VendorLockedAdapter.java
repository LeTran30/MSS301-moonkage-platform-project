package com.moonkage.catalog.service.replay;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.CatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** vendor.locked of vendor-service: the same full snapshot, status LOCKED and canOperate false. */
@Component
@RequiredArgsConstructor
public class VendorLockedAdapter implements ProjectionReplayAdapter {
    static final String ROUTING_KEY = "vendor.locked";

    private final VendorSnapshotReader snapshotReader;
    private final CatalogProjectionService projection;

    @Override
    public String routingKey() {
        return ROUTING_KEY;
    }

    @Override
    public ProjectionOutcome apply(InboxEntry storedEvent) {
        return projection.applyVendor(storedEvent.eventId(), ROUTING_KEY, snapshotReader.readRow(storedEvent));
    }
}
