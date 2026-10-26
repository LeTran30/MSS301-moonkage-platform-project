package com.moonkage.vendor.vendor;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerAccountId(String ownerAccountId);

    boolean existsByOwnerAccountId(String ownerAccountId);

    /** Oldest first, so the admin reviews in the order profiles arrived (FR-45). */
    List<Vendor> findByStatusOrderByCreatedAtAsc(VendorStatus status);

    List<Vendor> findAllByOrderByCreatedAtAsc();
}
