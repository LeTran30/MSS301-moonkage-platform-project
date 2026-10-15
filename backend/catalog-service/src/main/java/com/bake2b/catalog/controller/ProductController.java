package com.bake2b.catalog.controller;

import com.bake2b.catalog.dto.response.PageResponse;
import com.bake2b.catalog.dto.response.ProductResponse;
import com.bake2b.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Public browsing, no login needed (FR-04). Only products ON_SALE are visible. */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> search(
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return productService.searchOnSale(vendorId, keyword, page, size);
    }

    @GetMapping("/{productId}")
    public ProductResponse getProduct(@PathVariable String productId) {
        return productService.getOnSaleProduct(productId);
    }
}
