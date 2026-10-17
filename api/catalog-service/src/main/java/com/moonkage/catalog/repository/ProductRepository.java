package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.enums.ProductStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findByIdAndDeletedFalse(String id);

    Optional<Product> findByIdAndStatusAndDeletedFalse(String id, ProductStatus status);

    List<Product> findByVendorIdAndDeletedFalseOrderByCreatedAtDesc(String vendorId);

    List<Product> findByVendorIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(String vendorId, ProductStatus status);

    /** Public listing (FR-04): products on sale, optionally of one vendor and/or matching a keyword in the name. */
    @Query("""
            select p from Product p
            where p.deleted = false and p.status = com.moonkage.catalog.enums.ProductStatus.ON_SALE
              and (:vendorId is null or p.vendorId = :vendorId)
              and (:keyword is null or lower(p.name) like lower(concat('%', cast(:keyword as string), '%')))
            """)
    Page<Product> searchOnSale(@Param("vendorId") String vendorId, @Param("keyword") String keyword, Pageable pageable);
}
