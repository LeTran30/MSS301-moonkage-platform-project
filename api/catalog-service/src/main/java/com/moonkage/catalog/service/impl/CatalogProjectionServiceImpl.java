package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.entity.projection.ProjectionRowValidation;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.repository.CatalogProjectionRepository;
import com.moonkage.catalog.service.CatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CatalogProjectionServiceImpl implements CatalogProjectionService {
    private static final int MAX_EVENT_ID_LENGTH = 64;
    private final CatalogProjectionRepository repository;

    @Override
    public ProjectionOutcome applyProduct(String eventId, ProductProjectionRow row) {
        return claim(eventId, "product.upserted") ? repository.applyProduct(row) : ProjectionOutcome.DUPLICATE;
    }

    @Override
    public ProjectionOutcome removeProduct(String eventId, String productId, long sourceVersion) {
        ProjectionRowValidation.requireId(productId);
        if (sourceVersion < 0) {
            throw new IllegalArgumentException("Source version must be non-negative");
        }
        return claim(eventId, "product.removed")
                ? repository.removeProduct(productId, sourceVersion)
                : ProjectionOutcome.DUPLICATE;
    }

    @Override
    public ProjectionOutcome applyVendor(String eventId, String routingKey, VendorProjectionRow row) {
        if (!("vendor.updated".equals(routingKey) || "vendor.locked".equals(routingKey))
                || ("vendor.locked".equals(routingKey) && (!"LOCKED".equals(row.status()) || row.canOperate()))) {
            throw new IllegalArgumentException("Invalid normalized vendor state source");
        }
        return claim(eventId, routingKey) ? repository.applyVendor(row) : ProjectionOutcome.DUPLICATE;
    }

    @Override
    public ProjectionOutcome applyReview(String eventId, ReviewProjectionRow row) {
        return claim(eventId, "review.created") ? repository.applyReview(row) : ProjectionOutcome.DUPLICATE;
    }

    @Override
    public void rebuildRating(String productId) {
        ProjectionRowValidation.requireId(productId);
        repository.rebuildRating(productId);
    }

    private boolean claim(String eventId, String routingKey) {
        if (eventId == null || eventId.isBlank() || eventId.length() > MAX_EVENT_ID_LENGTH) {
            throw new IllegalArgumentException("Invalid event identity");
        }
        return repository.claimEvent(eventId, routingKey);
    }
}
