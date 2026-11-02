package com.moonkage.catalog.service.replay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.CatalogProjectionService;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** product.upserted of vendor-service: the full product snapshot (contract §4) into product_views. */
@Component
@RequiredArgsConstructor
public class ProductUpsertedAdapter implements ProjectionReplayAdapter {
    static final String ROUTING_KEY = "product.upserted";
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
        JsonNode data = envelope.data();
        var row = new ProductProjectionRow(
                reader.requireAggregateId(envelope, "productId"),
                reader.requireText(data, "vendorId"),
                reader.requireText(data, "name"),
                reader.requireText(data, "description"),
                reader.requireTextList(data, "crustCodes"),
                reader.requireTextList(data, "fillingCodes"),
                reader.requireText(data, "brand"),
                reader.nullableText(data, "origin"),
                requirePositiveOrNull(reader.nullableInt(data, "piecesPerBox"), "piecesPerBox"),
                reader.requireLong(data, "listPrice"),
                reader.requireInt(data, "stock"),
                reader.requireDate(data, "expiryDate"),
                reader.requireEnum(data, "deliveryLabel", DeliveryLabel.class),
                requirePositiveOrNull(reader.nullableInt(data, "quoteThreshold"), "quoteThreshold"),
                reader.requireEnum(data, "status", ProductStatus.class),
                reader.requireTextList(data, "imageKeys"),
                readPriceTiers(data),
                envelope.sourceVersion());
        return projection.applyProduct(storedEvent.eventId(), row);
    }

    /** {fromQty > 0, unitPrice > 0}, fromQty unique and increasing (contract §4); stored in that shape only. */
    private ArrayNode readPriceTiers(JsonNode data) {
        ArrayNode tiers = JsonNodeFactory.instance.arrayNode();
        Set<Integer> seen = new HashSet<>();
        int previous = 0;
        for (JsonNode tier : reader.requireArray(data, "priceTiers")) {
            if (!tier.isObject()) {
                throw new IllegalArgumentException("priceTiers must hold objects");
            }
            int fromQty = reader.requireInt(tier, "fromQty");
            long unitPrice = reader.requireLong(tier, "unitPrice");
            if (fromQty <= 0 || unitPrice <= 0 || !seen.add(fromQty) || fromQty <= previous) {
                throw new IllegalArgumentException("Invalid price tier");
            }
            previous = fromQty;
            tiers.addObject().put("fromQty", fromQty).put("unitPrice", unitPrice);
        }
        return tiers;
    }

    private static Integer requirePositiveOrNull(Integer value, String field) {
        if (value != null && value <= 0) {
            throw new IllegalArgumentException(field + " must be positive");
        }
        return value;
    }
}
