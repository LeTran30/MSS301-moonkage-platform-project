package com.moonkage.catalog.repository.readmodel;

import java.util.List;

/** Counts of each filter value over the products a facet query matched; bounds null when nothing matched. */
public record ProductFacetRows(
        List<ValueCount> crusts,
        List<ValueCount> fillings,
        List<ValueCount> brands,
        List<VendorCount> vendors,
        Long priceMin,
        Long priceMax) {

    public record ValueCount(String value, long count) {}

    public record VendorCount(String vendorId, String vendorName, long count) {}
}
