package com.moonkage.catalog.controller;

import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.service.ProductService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Shop product management (FR-30 - FR-32). X-Account-Id comes from the gateway, taken from the access
 * token.
 */
@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(accountId, request));
    }

    @GetMapping
    public List<ProductResponse> getMyProducts(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @RequestParam(required = false) ProductStatus status) {
        return productService.getMyProducts(accountId, status);
    }

    @GetMapping("/{productId}")
    public ProductResponse getMyProduct(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String productId) {
        return productService.getMyProduct(accountId, productId);
    }

    /** Send only the fields to change; everything else keeps its value. */
    @PutMapping("/{productId}")
    public ProductResponse updateProduct(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String productId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                            description = "Chỉ gửi các trường cần sửa, trường không gửi giữ nguyên giá trị cũ",
                            content =
                                    @Content(
                                            examples =
                                                    @ExampleObject(
                                                            value = "{\n  \"listPrice\": 470000,\n  \"stock\": 80\n}")))
                    @Valid
                    @RequestBody
                    UpdateProductRequest request) {
        return productService.updateProduct(accountId, productId, request);
    }

    /** visible=true: ON_SALE, visible=false: HIDDEN. */
    @PatchMapping("/{productId}/visibility")
    public ProductResponse setVisibility(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String productId,
            @RequestParam boolean visible) {
        return productService.setVisibility(accountId, productId, visible);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String productId) {
        productService.deleteProduct(accountId, productId);
        return ResponseEntity.noContent().build();
    }
}
