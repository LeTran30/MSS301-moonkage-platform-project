package com.moonkage.catalog.controller;

import com.moonkage.catalog.dto.response.ApiResponse;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;
import com.moonkage.catalog.service.ProductReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("!legacy-writer")
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductReadController {
    private final ProductReadService service;

    @GetMapping
    public ApiResponse<PageResponse<ProductListingResponse>> search(
            @RequestParam String provinceCode,
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) String q,
            @RequestHeader(value = "X-Account-Id", required = false) String accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.search(provinceCode, vendorId, q, accountId, page, size));
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
