package com.moonkage.catalog.service.replay;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.CatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** vendor.updated of vendor-service into vendor_snapshots. */
@Component
@RequiredArgsConstructor
public class VendorUpdatedAdapter implements ProjectionReplayAdapter {
    static final String ROUTING_KEY = "vendor.updated";

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
