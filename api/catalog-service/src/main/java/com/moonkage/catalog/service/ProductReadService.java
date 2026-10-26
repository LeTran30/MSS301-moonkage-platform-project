package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;

public interface ProductReadService {
    PageResponse<ProductListingResponse> search(
            String provinceCode, String vendorId, String query, String accountId, int page, int size);

    ProductListingResponse getProduct(String productId, String provinceCode, String accountId);

    PageResponse<ProductReviewResponse> getReviews(String productId, String provinceCode, int page, int size);
}
