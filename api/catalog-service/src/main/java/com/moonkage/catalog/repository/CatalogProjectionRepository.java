package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import com.moonkage.catalog.enums.ProjectionOutcome;

public interface CatalogProjectionRepository {
    boolean claimEvent(String eventId, String routingKey);

    ProjectionOutcome applyProduct(ProductProjectionRow row);

    ProjectionOutcome removeProduct(String productId, long sourceVersion);

    ProjectionOutcome applyVendor(VendorProjectionRow row);

    ProjectionOutcome applyReview(ReviewProjectionRow row);

    void rebuildRating(String productId);
}
