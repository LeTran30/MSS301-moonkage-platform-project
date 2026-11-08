package com.moonkage.catalog.service.replay;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * The full vendor snapshot that vendor.updated and vendor.locked both carry, on one version stream (contract §6).
 * Only what catalog keeps is read; the order profile and status reason belong to other copies.
 */
@Component
@RequiredArgsConstructor
public class VendorSnapshotReader {
    private static final String AGGREGATE_TYPE = "VENDOR";

    private final ProjectionEventReader reader;

    public VendorProjectionRow readRow(InboxEntry storedEvent) {
        var envelope = reader.readEnvelope(storedEvent, AGGREGATE_TYPE);
        JsonNode data = envelope.data();
        return new VendorProjectionRow(
                reader.requireAggregateId(envelope, "vendorId"),
                reader.requireText(data, "ownerAccountId"),
                reader.requireText(data, "businessName"),
                // The province of the shop is optional (B-3.1): a copy written before the field existed has none.
                reader.optionalText(data, "provinceCode"),
                reader.requireText(data, "status"),
                reader.requireBoolean(data, "canOperate"),
                reader.requireBoolean(data, "sellsShop"),
                reader.requireBoolean(data, "acceptsOrders"),
                reader.requireTextList(data, "deliveryAreas"),
                reader.nullableLong(data, "localDeliveryFee"),
                envelope.sourceVersion());
    }
}
