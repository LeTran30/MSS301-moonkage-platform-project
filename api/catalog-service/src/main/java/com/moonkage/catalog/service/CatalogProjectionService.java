package com.moonkage.catalog.service;

import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import com.moonkage.catalog.enums.ProjectionOutcome;

/** Internal projection port; deliberately no wire event deserialization or HTTP endpoint. */
public interface CatalogProjectionService {
    ProjectionOutcome applyProduct(String eventId, ProductProjectionRow row);

    ProjectionOutcome removeProduct(String eventId, String productId, long sourceVersion);

    ProjectionOutcome applyVendor(String eventId, String routingKey, VendorProjectionRow row);

    ProjectionOutcome applyReview(String eventId, ReviewProjectionRow row);

    void rebuildRating(String productId);
}
