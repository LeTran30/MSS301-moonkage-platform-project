package com.moonkage.catalog.dto.response;

import java.util.List;

/**
 * The values the filters of M2.0 can offer, counted over the products on sale delivered to the province and matching
 * the text, before any other filter: no offered value leads to an empty list by itself. Labels of crusts and fillings
 * come from vendor-service (GET /api/cake-attributes); catalog only has the codes (L-19).
 *
 * @param priceMin lowest listPrice; null when there is no product
 * @param priceMax highest listPrice; null when there is no product
 */
public record ProductFacetsResponse(
        List<CodeCount> crusts,
        List<CodeCount> fillings,
        List<CodeCount> brands,
        List<VendorCount> vendors,
        Long priceMin,
        Long priceMax) {

    /** A crust or filling code, or a brand name, and how many products have it. */
    public record CodeCount(String value, long count) {}

    public record VendorCount(String vendorId, String vendorName, long count) {}
}
