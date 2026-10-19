package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.ImageUploadRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.PresignedUploadLinkResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.enums.ProductStatus;
import java.util.List;

public interface ProductService {

    /** Step 1 of the two-step image upload; the returned key goes into imageKeys of create/update. */
    PresignedUploadLinkResponse createImageUploadLink(String accountId, ImageUploadRequest request);

    ProductResponse createProduct(String accountId, CreateProductRequest request);

    ProductResponse updateProduct(String accountId, String productId, UpdateProductRequest request);

    ProductResponse setVisibility(String accountId, String productId, boolean visible);

    void deleteProduct(String accountId, String productId);

    List<ProductResponse> getMyProducts(String accountId, ProductStatus status);

    ProductResponse getMyProduct(String accountId, String productId);

    PageResponse<ProductResponse> searchOnSale(String vendorId, String keyword, int page, int size);

    ProductResponse getOnSaleProduct(String productId);
}
