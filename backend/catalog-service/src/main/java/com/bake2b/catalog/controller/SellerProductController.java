package com.bake2b.catalog.controller;

import com.bake2b.catalog.dto.request.CreateProductRequest;
import com.bake2b.catalog.dto.request.UpdateProductRequest;
import com.bake2b.catalog.dto.response.ProductResponse;
import com.bake2b.catalog.enums.ProductStatus;
import com.bake2b.catalog.service.ProductService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Shop product management (FR-30 - FR-32). X-User-Id / X-User-Role come from the gateway, taken from the access token. */
@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody CreateProductRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(userId, role, request));
    }

    @GetMapping
    public List<ProductResponse> getMyProducts(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) ProductStatus status
    ) {
        return productService.getMyProducts(userId, role, status);
    }

    @GetMapping("/{productId}")
    public ProductResponse getMyProduct(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String productId
    ) {
        return productService.getMyProduct(userId, role, productId);
    }

    /** Send only the fields to change; everything else keeps its value. */
    @PutMapping("/{productId}")
    public ProductResponse updateProduct(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String productId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Chỉ gửi các trường cần sửa, trường không gửi giữ nguyên giá trị cũ",
                    content = @Content(examples = @ExampleObject(value = "{\n  \"listPrice\": 470000,\n  \"stock\": 80\n}")))
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return productService.updateProduct(userId, role, productId, request);
    }

    /** visible=true: ON_SALE, visible=false: HIDDEN. */
    @PatchMapping("/{productId}/visibility")
    public ProductResponse setVisibility(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String productId,
            @RequestParam boolean visible
    ) {
        return productService.setVisibility(userId, role, productId, visible);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String productId
    ) {
        productService.deleteProduct(userId, role, productId);
        return ResponseEntity.noContent().build();
    }
}
