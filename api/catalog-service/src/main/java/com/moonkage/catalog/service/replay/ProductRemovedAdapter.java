package com.moonkage.catalog.service.replay;

import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.CatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** product.removed of vendor-service: the terminal signal {productId, vendorId, status REMOVED} (contract §5). */
@Component
@RequiredArgsConstructor
public class ProductRemovedAdapter implements ProjectionReplayAdapter {
    static final String ROUTING_KEY = "product.removed";
    private static final String AGGREGATE_TYPE = "PRODUCT";

    private final ProjectionEventReader reader;
    private final CatalogProjectionService projection;

    @Override
    public String routingKey() {
        return ROUTING_KEY;
    }

    @Override
    public ProjectionOutcome apply(InboxEntry storedEvent) {
        var envelope = reader.readEnvelope(storedEvent, AGGREGATE_TYPE);
        String productId = reader.requireAggregateId(envelope, "productId");
        reader.requireText(envelope.data(), "vendorId");
        if (reader.requireEnum(envelope.data(), "status", ProductStatus.class) != ProductStatus.REMOVED) {
            throw new IllegalArgumentException("product.removed must carry status REMOVED");
        }
        return projection.removeProduct(storedEvent.eventId(), productId, envelope.sourceVersion());
    }
}
