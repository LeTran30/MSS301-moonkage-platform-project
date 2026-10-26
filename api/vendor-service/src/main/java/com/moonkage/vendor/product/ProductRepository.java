package com.moonkage.vendor.product;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findByIdAndVendorId(String id, String vendorId);

    /** Newest first, as the Shop's product list shows them. */
    List<Product> findByVendorIdOrderByCreatedAtDesc(String vendorId);

    /**
     * Locked in id order, so two checkouts sharing products always lock them in the same order and never wait on
     * each other in a circle. A missing id is left out.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids ORDER BY p.id")
    List<Product> findForChangeByIdIn(Collection<String> ids);
}
