package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.enums.ProductStatus;
import java.util.List;

public interface ProductService {

    ProductResponse createProduct(String userId, String role, CreateProductRequest request);

    ProductResponse updateProduct(String userId, String role, String productId, UpdateProductRequest request);

    ProductResponse setVisibility(String userId, String role, String productId, boolean visible);

    void deleteProduct(String userId, String role, String productId);

    List<ProductResponse> getMyProducts(String userId, String role, ProductStatus status);

    ProductResponse getMyProduct(String userId, String role, String productId);

    PageResponse<ProductResponse> searchOnSale(String vendorId, String keyword, int page, int size);

    ProductResponse getOnSaleProduct(String productId);
}
