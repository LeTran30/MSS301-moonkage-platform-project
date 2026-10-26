package com.moonkage.vendor.web;

import com.moonkage.vendor.common.exception.ApiResponse;
import com.moonkage.vendor.product.ProductService;
import com.moonkage.vendor.product.dto.request.ProductImageUploadRequest;
import com.moonkage.vendor.product.dto.request.SaveProductRequest;
import com.moonkage.vendor.product.dto.request.UpdateProductRequest;
import com.moonkage.vendor.product.dto.response.ProductResponse;
import com.moonkage.vendor.security.CurrentUser;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** A Shop's products, write side (FR-29 to FR-34, FR-46). Buyers read them from catalog-service. */
@RestController
@RequestMapping("/api/vendors/{vendorId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping("/uploads")
    public ResponseEntity<ApiResponse<PresignedUploadLinkResponse>> createImageUploadLink(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody ProductImageUploadRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.createImageUploadLink(caller, vendorId, request)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody SaveProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(productService.createProduct(caller, vendorId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProducts(caller, vendorId)));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId, @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProduct(caller, vendorId, productId)));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> replaceProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @PathVariable String productId,
            @Valid @RequestBody SaveProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.replaceProduct(caller, vendorId, productId, request)));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @PathVariable String productId,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.updateProduct(caller, vendorId, productId, request)));
    }
}
