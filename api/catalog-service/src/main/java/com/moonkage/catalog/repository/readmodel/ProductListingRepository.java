package com.moonkage.catalog.repository.readmodel;

import com.moonkage.catalog.entity.readmodel.ProductListing;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.Repository;

/** No save/delete methods: callers cannot use a projection view as a write model. */
public interface ProductListingRepository extends Repository<ProductListing, String> {
    Optional<ProductListing> findById(String productId);

    /** The rows of a page found by JdbcProductSearchRepository, in no particular order. */
    List<ProductListing> findByProductIdIn(Collection<String> productIds);
}
