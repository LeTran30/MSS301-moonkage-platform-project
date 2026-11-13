package com.moonkage.catalog.repository.readmodel;

import com.moonkage.catalog.enums.ProductSort;
import java.time.LocalDate;
import java.util.List;

/**
 * A checked public search: the province is a known code, the words are the text split on spaces, every list may be
 * empty (no filter), the bounds may be null.
 */
public record ProductSearchFilter(
        String provinceCode,
        LocalDate businessDate,
        List<String> words,
        List<String> vendorIds,
        List<String> brands,
        List<String> crustCodes,
        List<String> fillingCodes,
        Long priceMin,
        Long priceMax,
        ProductSort sort) {

    public ProductSearchFilter {
        words = List.copyOf(words);
        vendorIds = List.copyOf(vendorIds);
        brands = List.copyOf(brands);
        crustCodes = List.copyOf(crustCodes);
        fillingCodes = List.copyOf(fillingCodes);
    }
}
