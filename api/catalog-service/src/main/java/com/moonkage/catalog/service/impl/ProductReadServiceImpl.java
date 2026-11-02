package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.config.PublicImageProperties;
import com.moonkage.catalog.dto.request.ProductSearchRequest;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductFacetsResponse;
import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.dto.response.ProductReviewResponse;
import com.moonkage.catalog.entity.readmodel.ProductListing;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductSort;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.mapper.ProductListingMapper;
import com.moonkage.catalog.repository.ProductReviewReadRepository;
import com.moonkage.catalog.repository.readmodel.JdbcProductSearchRepository;
import com.moonkage.catalog.repository.readmodel.ProductFacetRows;
import com.moonkage.catalog.repository.readmodel.ProductListingRepository;
import com.moonkage.catalog.repository.readmodel.ProductSearchFilter;
import com.moonkage.catalog.service.ProductReadService;
import com.moonkage.reference.Province;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductReadServiceImpl implements ProductReadService {
    private static final int MAX_PAGE_SIZE = 100;
    /** Bound the size of the generated search query. */
    private static final int MAX_FILTER_VALUES = 50;

    private static final int MAX_QUERY_WORDS = 10;
    private final ProductListingRepository repository;
    private final JdbcProductSearchRepository searchRepository;
    private final ProductReviewReadRepository reviewRepository;
    private final PublicImageProperties images;

    @Override
    public PageResponse<ProductListingResponse> search(ProductSearchRequest request, String accountId) {
        // 1. validate
        validateSearch(request);
        var pageable = pageRequest(request.page(), request.size());
        ProductSort sort = request.sort() == null
                ? ProductSort.RATING
                : ProductSort.fromParam(request.sort())
                        .orElseThrow(() -> new CatalogException(CatalogErrorCode.INVALID_REQUEST));
        var filter = new ProductSearchFilter(
                request.provinceCode(),
                wordsOf(request.query()),
                request.vendorIds(),
                request.brands(),
                request.crustCodes(),
                request.fillingCodes(),
                request.priceMin(),
                request.priceMax(),
                sort);

        // 2. one page of ids in order, then their rows
        List<String> ids = searchRepository.findPageIds(filter, pageable.getPageSize(), pageable.getOffset());
        Map<String, ProductListing> rows = repository.findByProductIdIn(ids).stream()
                .collect(Collectors.toMap(ProductListing::getProductId, Function.identity()));
        List<ProductListingResponse> content = ids.stream()
                .map(rows::get)
                .filter(Objects::nonNull)
                .map(product -> ProductListingMapper.toResponse(product, accountId, images::toPublicUrl))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, searchRepository.count(filter)));
    }

    @Override
    public ProductFacetsResponse getFacets(String provinceCode, String query) {
        requireProvince(provinceCode);
        List<String> words = wordsOf(query == null || query.isBlank() ? null : query.trim());
        if (words.size() > MAX_QUERY_WORDS) {
            throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
        }
        var filter = new ProductSearchFilter(
                provinceCode, words, List.of(), List.of(), List.of(), List.of(), null, null, ProductSort.RATING);
        ProductFacetRows rows = searchRepository.findFacets(filter);
        return new ProductFacetsResponse(
                toCounts(rows.crusts()),
                toCounts(rows.fillings()),
                toCounts(rows.brands()),
                rows.vendors().stream()
                        .map(vendor -> new ProductFacetsResponse.VendorCount(
                                vendor.vendorId(), vendor.vendorName(), vendor.count()))
                        .toList(),
                rows.priceMin(),
                rows.priceMax());
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

    private void validateSearch(ProductSearchRequest request) {
        requireProvince(request.provinceCode());
        boolean tooMany = request.vendorIds().size() > MAX_FILTER_VALUES
                || request.brands().size() > MAX_FILTER_VALUES
                || request.crustCodes().size() > MAX_FILTER_VALUES
                || request.fillingCodes().size() > MAX_FILTER_VALUES
                || wordsOf(request.query()).size() > MAX_QUERY_WORDS;
        boolean badPrice = (request.priceMin() != null && request.priceMin() < 0)
                || (request.priceMax() != null && request.priceMax() < 0)
                || (request.priceMin() != null
                        && request.priceMax() != null
                        && request.priceMin() > request.priceMax());
        if (tooMany || badPrice) {
            throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
        }
    }

    /** The search text split on spaces; none when there is no text (it arrives trimmed). */
    private static List<String> wordsOf(String query) {
        return query == null ? List.of() : List.of(query.split("\\s+"));
    }

    private static List<ProductFacetsResponse.CodeCount> toCounts(List<ProductFacetRows.ValueCount> rows) {
        return rows.stream()
                .map(row -> new ProductFacetsResponse.CodeCount(row.value(), row.count()))
                .toList();
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
