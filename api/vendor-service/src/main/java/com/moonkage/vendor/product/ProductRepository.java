package com.moonkage.vendor.product;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findByIdAndVendorId(String id, String vendorId);

    /** Newest first, as the Shop's product list shows them. */
    List<Product> findByVendorIdOrderByCreatedAtDesc(String vendorId);
}
