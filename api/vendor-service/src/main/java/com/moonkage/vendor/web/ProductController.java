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

    /** Step 1 of an image upload (FR-29): send the file to uploadUrl, then its tempKey among imageKeys. */
    @PostMapping("/uploads")
    public ResponseEntity<ApiResponse<PresignedUploadLinkResponse>> createImageUploadLink(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody ProductImageUploadRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.createImageUploadLink(caller, vendorId, request)));
    }

    /**
     * FR-29: a new product, on sale at once (BR-24). The Shop must be approved, paid up and selling in the Shop; at
     * least one image, one crust and one filling; brand and origin when resold.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody SaveProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(productService.createProduct(caller, vendorId, request)));
    }

    /** The Shop's products, every status, newest first. Owner or admin. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProducts(caller, vendorId)));
    }

    /** One product as its Shop sees it, with the version to send back on PUT. Owner or admin. */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId, @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProduct(caller, vendorId, productId)));
    }

    /**
     * FR-30, FR-32, FR-33: the whole product again, with the version read before editing (409 VENDOR_027 when
     * someone changed it since, a sale included).
     */
    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> replaceProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @PathVariable String productId,
            @Valid @RequestBody SaveProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.replaceProduct(caller, vendorId, productId, request)));
    }

    /** Owner: {status: ON_SALE | HIDDEN} (FR-34). Admin: {status: REMOVED, removedReason}, for good (FR-46). */
    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @PathVariable String productId,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.updateProduct(caller, vendorId, productId, request)));
    }
}
