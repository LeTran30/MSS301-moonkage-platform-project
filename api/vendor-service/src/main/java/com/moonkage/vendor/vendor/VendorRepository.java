package com.moonkage.vendor.vendor;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerAccountId(String ownerAccountId);
}
