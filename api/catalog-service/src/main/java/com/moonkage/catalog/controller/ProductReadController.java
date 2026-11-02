package com.moonkage.catalog.controller;

import com.moonkage.catalog.dto.request.ProductSearchRequest;
import com.moonkage.catalog.dto.response.ApiResponse;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductFacetsResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;
import com.moonkage.catalog.service.ProductReadService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductReadController {
    private final ProductReadService service;

    /** M2.0: several values of one parameter (repeated or comma separated) match any; parameters all match. */
    @GetMapping
    public ApiResponse<PageResponse<ProductListingResponse>> search(
            @RequestParam String provinceCode,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> vendorId,
            @RequestParam(required = false) List<String> brand,
            @RequestParam(required = false) List<String> crust,
            @RequestParam(required = false) List<String> filling,
            @RequestParam(required = false) Long priceMin,
            @RequestParam(required = false) Long priceMax,
            @RequestParam(required = false) String sort,
            @RequestHeader(value = "X-Account-Id", required = false) String accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var request = new ProductSearchRequest(
                provinceCode, q, vendorId, brand, crust, filling, priceMin, priceMax, sort, page, size);
        return ApiResponse.ok(service.search(request, accountId));
    }

    /** M2.0: what the filters can offer in the province for the text, with counts. */
    @GetMapping("/facets")
    public ApiResponse<ProductFacetsResponse> getFacets(
            @RequestParam String provinceCode, @RequestParam(required = false) String q) {
        return ApiResponse.ok(service.getFacets(provinceCode, q));
    }

    @GetMapping("/{productId}")
    public ApiResponse<ProductListingResponse> getProduct(
            @PathVariable String productId,
            @RequestParam(required = false) String provinceCode,
            @RequestHeader(value = "X-Account-Id", required = false) String accountId) {
        return ApiResponse.ok(service.getProduct(productId, provinceCode, accountId));
    }

    @GetMapping("/{productId}/reviews")
    public ApiResponse<PageResponse<ProductReviewResponse>> getReviews(
            @PathVariable String productId,
            @RequestParam(required = false) String provinceCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.getReviews(productId, provinceCode, page, size));
    }
}
