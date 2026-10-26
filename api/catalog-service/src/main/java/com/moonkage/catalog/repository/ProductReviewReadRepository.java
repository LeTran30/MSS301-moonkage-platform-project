package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import java.util.List;

public interface ProductReviewReadRepository {
    List<ReviewProjectionRow> findReviews(String productId, int limit, long offset);

    long countReviews(String productId);
}
