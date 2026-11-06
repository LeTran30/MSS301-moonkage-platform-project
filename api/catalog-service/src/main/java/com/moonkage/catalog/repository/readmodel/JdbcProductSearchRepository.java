package com.moonkage.catalog.repository.readmodel;

import com.moonkage.catalog.enums.ProductSort;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.stereotype.Repository;

/**
 * Public search over product_listings, built per request because every filter is optional. Values always go in as
 * parameters; only fixed SQL fragments are concatenated.
 */
@Repository
@RequiredArgsConstructor
public class JdbcProductSearchRepository {
    /** On sale, from a Shop that can sell in the Shop now, delivered to :province. */
    private static final String VISIBLE = """
            status = 'ON_SALE' AND can_operate AND sells_shop
            AND (delivery_label = 'NATIONWIDE' OR :province = ANY(delivery_areas))""";

    private static final String SEARCHED_TEXT =
            "unaccent(lower(name || ' ' || coalesce(brand, '') || ' ' || vendor_name))";

    private static final Map<ProductSort, String> ORDER_BY = Map.of(
            ProductSort.RATING, "rating_avg DESC NULLS LAST, rating_count DESC, product_id",
            ProductSort.PRICE_ASC, "list_price ASC, product_id",
            ProductSort.PRICE_DESC, "list_price DESC, product_id",
            ProductSort.NEWEST, "updated_at DESC, product_id");

    private final NamedParameterJdbcTemplate jdbc;

    /** Ids of one page in the requested order. */
    public List<String> findPageIds(ProductSearchFilter filter, int limit, long offset) {
        var parameters = parameters(filter).addValue("limit", limit).addValue("offset", offset);
        return jdbc.queryForList(
                "SELECT product_id FROM product_listings WHERE " + where(filter, true) + " ORDER BY "
                        + ORDER_BY.get(filter.sort()) + " LIMIT :limit OFFSET :offset",
                parameters,
                String.class);
    }

    public long count(ProductSearchFilter filter) {
        Long total = jdbc.queryForObject(
                "SELECT count(*) FROM product_listings WHERE " + where(filter, true), parameters(filter), Long.class);
        return total == null ? 0 : total;
    }

    /** Facets over the visible products matching the words only, so the other filters never empty their options. */
    public ProductFacetRows findFacets(ProductSearchFilter filter) {
        var parameters = parameters(filter);
        String base = "WITH base AS (SELECT * FROM product_listings WHERE " + where(filter, false) + ") ";
        var crusts = valueCounts(
                base + "SELECT code AS value, count(*) AS total FROM base, unnest(crust_codes) code"
                        + " GROUP BY code ORDER BY code",
                parameters);
        var fillings = valueCounts(
                base + "SELECT code AS value, count(*) AS total FROM base, unnest(filling_codes) code"
                        + " GROUP BY code ORDER BY code",
                parameters);
        var brands = valueCounts(
                base + "SELECT brand AS value, count(*) AS total FROM base WHERE brand IS NOT NULL"
                        + " GROUP BY brand ORDER BY brand",
                parameters);
        var vendors = jdbc.query(
                base + "SELECT vendor_id, vendor_name, count(*) AS total FROM base"
                        + " GROUP BY vendor_id, vendor_name ORDER BY vendor_name, vendor_id",
                parameters,
                (row, index) -> new ProductFacetRows.VendorCount(
                        row.getString("vendor_id"), row.getString("vendor_name"), row.getLong("total")));
        var bounds =
                jdbc.queryForMap(base + "SELECT min(list_price) AS low, max(list_price) AS high FROM base", parameters);
        return new ProductFacetRows(
                crusts, fillings, brands, vendors, toLong(bounds.get("low")), toLong(bounds.get("high")));
    }

    private List<ProductFacetRows.ValueCount> valueCounts(String sql, MapSqlParameterSource parameters) {
        return jdbc.query(
                sql,
                parameters,
                (row, index) -> new ProductFacetRows.ValueCount(row.getString("value"), row.getLong("total")));
    }

    private static String where(ProductSearchFilter filter, boolean withFilters) {
        List<String> conditions = new ArrayList<>();
        conditions.add(VISIBLE);
        for (int index = 0; index < filter.words().size(); index++) {
            conditions.add(SEARCHED_TEXT + " LIKE '%' || unaccent(lower(:word" + index + ")) || '%' ESCAPE '\\'");
        }
        if (withFilters) {
            if (!filter.vendorIds().isEmpty()) {
                conditions.add("vendor_id IN (:vendorIds)");
            }
            if (!filter.brands().isEmpty()) {
                conditions.add("brand IN (:brands)");
            }
            if (!filter.crustCodes().isEmpty()) {
                conditions.add("crust_codes && CAST(:crustCodes AS text[])");
            }
            if (!filter.fillingCodes().isEmpty()) {
                conditions.add("filling_codes && CAST(:fillingCodes AS text[])");
            }
            if (filter.priceMin() != null) {
                conditions.add("list_price >= :priceMin");
            }
            if (filter.priceMax() != null) {
                conditions.add("list_price <= :priceMax");
            }
        }
        return String.join(" AND ", conditions);
    }

    private static MapSqlParameterSource parameters(ProductSearchFilter filter) {
        var parameters = new MapSqlParameterSource()
                .addValue("province", filter.provinceCode())
                .addValue("vendorIds", filter.vendorIds())
                .addValue("brands", filter.brands())
                .addValue("crustCodes", textArray(filter.crustCodes()))
                .addValue("fillingCodes", textArray(filter.fillingCodes()))
                .addValue("priceMin", filter.priceMin())
                .addValue("priceMax", filter.priceMax());
        for (int index = 0; index < filter.words().size(); index++) {
            parameters.addValue("word" + index, escapeLike(filter.words().get(index)));
        }
        return parameters;
    }

    private static SqlArrayValue textArray(List<String> values) {
        return new SqlArrayValue("text", values.toArray());
    }

    private static String escapeLike(String word) {
        return word.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }
}
