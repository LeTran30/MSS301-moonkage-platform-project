package com.moonkage.catalog.service;

import com.moonkage.api.PageResponse;
import com.moonkage.catalog.dto.request.ProductSearchRequest;
import com.moonkage.catalog.dto.response.ProductFacetsResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;

public interface ProductReadService {
    PageResponse<ProductListingResponse> search(ProductSearchRequest request, String accountId);

    ProductFacetsResponse getFacets(String provinceCode, String query);

    ProductListingResponse getProduct(String productId, String provinceCode, String accountId);

    PageResponse<ProductReviewResponse> getReviews(String productId, String provinceCode, int page, int size);
}
