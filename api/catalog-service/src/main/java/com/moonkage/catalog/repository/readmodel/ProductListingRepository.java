package com.moonkage.catalog.repository.readmodel;

import com.moonkage.catalog.entity.readmodel.ProductListing;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** No save/delete methods: callers cannot use a projection view as a write model. */
public interface ProductListingRepository extends Repository<ProductListing, String> {
    Optional<ProductListing> findById(String productId);

    @Query(value = """
            SELECT * FROM product_listings
            WHERE status = 'ON_SALE' AND can_operate AND sells_shop
              AND (delivery_label = 'NATIONWIDE' OR :province = ANY(delivery_areas))
              AND (CAST(:vendorId AS text) IS NULL OR vendor_id = :vendorId)
              AND (name ILIKE :pattern ESCAPE '\\' OR brand ILIKE :pattern ESCAPE '\\')
            ORDER BY updated_at DESC, product_id
            """, countQuery = """
            SELECT count(*) FROM product_listings
            WHERE status = 'ON_SALE' AND can_operate AND sells_shop
              AND (delivery_label = 'NATIONWIDE' OR :province = ANY(delivery_areas))
              AND (CAST(:vendorId AS text) IS NULL OR vendor_id = :vendorId)
              AND (name ILIKE :pattern ESCAPE '\\' OR brand ILIKE :pattern ESCAPE '\\')
            """, nativeQuery = true)
    Page<ProductListing> searchPublic(
            @Param("province") String province,
            @Param("vendorId") String vendorId,
            @Param("pattern") String pattern,
            Pageable pageable);
}
