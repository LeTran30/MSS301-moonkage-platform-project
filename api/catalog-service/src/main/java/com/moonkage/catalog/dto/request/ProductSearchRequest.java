package com.moonkage.catalog.dto.request;

import java.util.List;
import java.util.Objects;

/**
 * The public product list (M2.0, FR-06, AC-06.2) as the query string gave it, normalized: the text trimmed (blank is
 * none), each list without blanks or repeats. Several values of one list match any of them; different lists must all
 * match. The sort stays the raw parameter, checked by the service.
 *
 * @param vendorIds the Shops, by id (a Shop's page sends its own)
 * @param priceMin lowest listPrice in VND, inclusive; null for no bound
 * @param priceMax highest listPrice in VND, inclusive; null for no bound
 * @param sort rating (default), price-asc, price-desc or newest
 */
public record ProductSearchRequest(
        String provinceCode,
        String query,
        List<String> vendorIds,
        List<String> brands,
        List<String> crustCodes,
        List<String> fillingCodes,
        Long priceMin,
        Long priceMax,
        String sort,
        int page,
        int size) {

    public ProductSearchRequest {
        query = query == null || query.isBlank() ? null : query.trim();
        vendorIds = clean(vendorIds);
        brands = clean(brands);
        crustCodes = clean(crustCodes);
        fillingCodes = clean(fillingCodes);
    }

    private static List<String> clean(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();
    }
}
