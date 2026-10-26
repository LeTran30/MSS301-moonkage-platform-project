package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import java.sql.Timestamp;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcCatalogProjectionRepository implements CatalogProjectionRepository {
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate namedJdbc;

    @Override
    public boolean claimEvent(String eventId, String routingKey) {
        int inserted = jdbc.update(
                "INSERT INTO processed_events(event_id, routing_key) VALUES (?, ?) ON CONFLICT DO NOTHING",
                eventId,
                routingKey);
        if (inserted == 0) {
            String existing = jdbc.queryForObject(
                    "SELECT routing_key FROM processed_events WHERE event_id = ?", String.class, eventId);
            if (!routingKey.equals(existing)) {
                throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
            }
        }
        return inserted != 0;
    }

    @Override
    public ProjectionOutcome applyProduct(ProductProjectionRow row) {
        lockProduct(row.productId());
        if (row.sourceVersion() <= getProductVersion(row.productId())) {
            return ProjectionOutcome.STALE;
        }
        if (hasTombstone(row.productId()) && row.status() != ProductStatus.REMOVED) {
            return ProjectionOutcome.REMOVED;
        }
        if (Boolean.TRUE.equals(jdbc.queryForObject(
                """
                SELECT EXISTS(SELECT 1 FROM product_reviews WHERE product_id = ? AND vendor_id <> ?)
                    OR EXISTS(SELECT 1 FROM product_views WHERE product_id = ? AND vendor_id <> ?)
                """, Boolean.class, row.productId(), row.vendorId(), row.productId(), row.vendorId()))) {
            throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
        }
        namedJdbc.update("""
                INSERT INTO product_views(product_id, vendor_id, name, description, cake_type, brand, origin,
                    pieces_per_box, list_price, stock, expiry_date, delivery_label, quote_threshold, status,
                    image_keys, price_tiers, source_version)
                VALUES (:id, :vendor, :name, :description, :cake, :brand, :origin, :pieces, :price, :stock,
                    :expiry, :delivery, :threshold, :status, :images, CAST(:tiers AS jsonb), :version)
                ON CONFLICT (product_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
                    cake_type=EXCLUDED.cake_type, brand=EXCLUDED.brand, origin=EXCLUDED.origin,
                    pieces_per_box=EXCLUDED.pieces_per_box, list_price=EXCLUDED.list_price, stock=EXCLUDED.stock,
                    expiry_date=EXCLUDED.expiry_date, delivery_label=EXCLUDED.delivery_label,
                    quote_threshold=EXCLUDED.quote_threshold, status=EXCLUDED.status, image_keys=EXCLUDED.image_keys,
                    price_tiers=EXCLUDED.price_tiers, source_version=EXCLUDED.source_version, updated_at=now()
                WHERE product_views.source_version < EXCLUDED.source_version
                """, productParameters(row));
        if (row.status() == ProductStatus.REMOVED) {
            saveTombstone(row.productId(), row.sourceVersion());
        }
        updateRating(row.productId());
        return ProjectionOutcome.APPLIED;
    }

    @Override
    public ProjectionOutcome removeProduct(String productId, long sourceVersion) {
        lockProduct(productId);
        if (sourceVersion <= getProductVersion(productId)) {
            return ProjectionOutcome.STALE;
        }
        saveTombstone(productId, sourceVersion);
        jdbc.update("""
                UPDATE product_views SET status='REMOVED', source_version=?, updated_at=now()
                WHERE product_id=? AND source_version < ?
                """, sourceVersion, productId, sourceVersion);
        return ProjectionOutcome.APPLIED;
    }

    @Override
    public ProjectionOutcome applyVendor(VendorProjectionRow row) {
        int changed = namedJdbc.update(
                """
                INSERT INTO vendor_snapshots(vendor_id, owner_account_id, business_name, status, can_operate,
                    sells_shop, delivery_areas, local_delivery_fee, source_version)
                VALUES (:id, :owner, :name, :status, :operate, :shop, :areas, :fee, :version)
                ON CONFLICT (vendor_id) DO UPDATE SET owner_account_id=EXCLUDED.owner_account_id,
                    business_name=EXCLUDED.business_name, status=EXCLUDED.status, can_operate=EXCLUDED.can_operate,
                    sells_shop=EXCLUDED.sells_shop, delivery_areas=EXCLUDED.delivery_areas,
                    local_delivery_fee=EXCLUDED.local_delivery_fee,
                    source_version=EXCLUDED.source_version, updated_at=now()
                WHERE vendor_snapshots.source_version < EXCLUDED.source_version
                """,
                new MapSqlParameterSource()
                        .addValue("id", row.vendorId())
                        .addValue("owner", row.ownerAccountId())
                        .addValue("name", row.businessName())
                        .addValue("status", row.status())
                        .addValue("operate", row.canOperate())
                        .addValue("shop", row.sellsShop())
                        .addValue("areas", sqlArray(row.deliveryAreas()))
                        .addValue("fee", row.localDeliveryFee())
                        .addValue("version", row.sourceVersion()));
        return changed == 0 ? ProjectionOutcome.STALE : ProjectionOutcome.APPLIED;
    }

    @Override
    public ProjectionOutcome applyReview(ReviewProjectionRow row) {
        // A shared per-product transaction lock serializes review aggregates against upserts and rebuilds.
        lockProduct(row.productId());
        if (Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM product_views WHERE product_id=? AND vendor_id<>?)",
                Boolean.class,
                row.productId(),
                row.vendorId()))) {
            throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
        }
        int inserted = jdbc.update(
                """
                INSERT INTO product_reviews(review_id, product_id, vendor_id, rating, content, created_at)
                VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING
                """,
                row.reviewId(),
                row.productId(),
                row.vendorId(),
                row.rating(),
                row.content(),
                Timestamp.from(row.createdAt()));
        if (inserted == 0) {
            Boolean same = jdbc.queryForObject(
                    """
                    SELECT product_id=? AND vendor_id=? AND rating=? AND content IS NOT DISTINCT FROM CAST(? AS text)
                        AND created_at=? FROM product_reviews WHERE review_id=?
                    """,
                    Boolean.class,
                    row.productId(),
                    row.vendorId(),
                    row.rating(),
                    row.content(),
                    Timestamp.from(row.createdAt()),
                    row.reviewId());
            if (!Boolean.TRUE.equals(same)) {
                throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
            }
        }
        updateRating(row.productId());
        return inserted == 0 ? ProjectionOutcome.DUPLICATE : ProjectionOutcome.APPLIED;
    }

    @Override
    public void rebuildRating(String productId) {
        lockProduct(productId);
        updateRating(productId);
    }

    private void lockProduct(String productId) {
        jdbc.query(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", result -> {}, "catalog:product:" + productId);
    }

    private long getProductVersion(String productId) {
        Long version = jdbc.queryForObject("""
                SELECT max(source_version) FROM (
                    SELECT source_version FROM product_views WHERE product_id=?
                    UNION ALL SELECT source_version FROM product_tombstones WHERE product_id=?
                ) versions
                """, Long.class, productId, productId);
        return version == null ? -1 : version;
    }

    private boolean hasTombstone(String productId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM product_tombstones WHERE product_id=?)
                    OR EXISTS(SELECT 1 FROM product_views WHERE product_id=? AND status='REMOVED')
                """, Boolean.class, productId, productId));
    }

    private void saveTombstone(String productId, long version) {
        jdbc.update("""
                INSERT INTO product_tombstones(product_id, source_version) VALUES (?, ?)
                ON CONFLICT (product_id) DO UPDATE SET source_version=EXCLUDED.source_version, removed_at=now()
                WHERE product_tombstones.source_version < EXCLUDED.source_version
                """, productId, version);
    }

    private void updateRating(String productId) {
        jdbc.update("""
                UPDATE product_views SET rating_count=r.count, rating_avg=r.average
                FROM (SELECT count(*)::int AS count, round(avg(rating), 2) AS average
                    FROM product_reviews WHERE product_id=?) r
                WHERE product_id=?
                """, productId, productId);
    }

    private MapSqlParameterSource productParameters(ProductProjectionRow row) {
        return new MapSqlParameterSource()
                .addValue("id", row.productId())
                .addValue("vendor", row.vendorId())
                .addValue("name", row.name())
                .addValue("description", row.description())
                .addValue("cake", row.cakeType())
                .addValue("brand", row.brand())
                .addValue("origin", row.origin())
                .addValue("pieces", row.piecesPerBox())
                .addValue("price", row.listPrice())
                .addValue("stock", row.stock())
                .addValue("expiry", row.expiryDate())
                .addValue("delivery", row.deliveryLabel().name())
                .addValue("threshold", row.quoteThreshold())
                .addValue("status", row.status().name())
                .addValue("images", sqlArray(row.imageKeys()))
                .addValue("tiers", row.priceTiers().toString())
                .addValue("version", row.sourceVersion());
    }

    private SqlArrayValue sqlArray(List<String> values) {
        return new SqlArrayValue("text", values.toArray());
    }
}
