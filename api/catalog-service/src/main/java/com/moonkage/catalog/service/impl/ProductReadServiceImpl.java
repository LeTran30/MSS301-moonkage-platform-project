package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.config.PublicImageProperties;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;
import com.moonkage.catalog.entity.readmodel.ProductListing;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.mapper.ProductListingMapper;
import com.moonkage.catalog.repository.ProductReviewReadRepository;
import com.moonkage.catalog.repository.readmodel.ProductListingRepository;
import com.moonkage.catalog.service.ProductReadService;
import com.moonkage.reference.Province;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!legacy-writer")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductReadServiceImpl implements ProductReadService {
    private static final int MAX_PAGE_SIZE = 100;
    private final ProductListingRepository repository;
    private final ProductReviewReadRepository reviewRepository;
    private final PublicImageProperties images;

    @Override
    public PageResponse<ProductListingResponse> search(
            String provinceCode, String vendorId, String query, String accountId, int page, int size) {
        requireProvince(provinceCode);
        var pageable = pageRequest(page, size);
        String pattern = query == null
                ? "%"
                : "%" + query.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        return PageResponse.from(repository
                .searchPublic(provinceCode, vendorId, pattern, pageable)
                .map(product -> ProductListingMapper.toResponse(product, accountId, images::toPublicUrl)));
    }

    @Override
    public ProductListingResponse getProduct(String productId, String provinceCode, String accountId) {
        return ProductListingMapper.toResponse(getVisible(productId, provinceCode), accountId, images::toPublicUrl);
    }

    @Override
    public PageResponse<ProductReviewResponse> getReviews(String productId, String provinceCode, int page, int size) {
        getVisible(productId, provinceCode);
        var pageable = pageRequest(page, size);
        var rows = reviewRepository.findReviews(productId, pageable.getPageSize(), pageable.getOffset()).stream()
                .map(row -> new ProductReviewResponse(row.reviewId(), row.rating(), row.content(), row.createdAt()))
                .toList();
        return PageResponse.from(new PageImpl<>(rows, pageable, reviewRepository.countReviews(productId)));
    }

    private ProductListing getVisible(String productId, String provinceCode) {
        if (provinceCode != null) {
            requireProvince(provinceCode);
        }
        ProductListing product = repository
                .findById(productId)
                .orElseThrow(() -> new CatalogException(CatalogErrorCode.PRODUCT_NOT_FOUND));
        boolean deliverable = provinceCode == null
                || product.getDeliveryLabel() == DeliveryLabel.NATIONWIDE
                || Arrays.asList(product.getDeliveryAreas()).contains(provinceCode);
        if (product.getStatus() != ProductStatus.ON_SALE
                || !product.isCanOperate()
                || !product.isSellsShop()
                || !deliverable) {
            throw new CatalogException(CatalogErrorCode.PRODUCT_NOT_FOUND);
        }
        return product;
    }

    private void requireProvince(String provinceCode) {
        if (!Province.isKnown(provinceCode)) {
            throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
        }
    }

    private PageRequest pageRequest(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
        }
        return PageRequest.of(page, size);
    }
}
