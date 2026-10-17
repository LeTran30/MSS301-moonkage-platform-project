package com.moonkage.vendor.repository;

import com.moonkage.vendor.entity.Vendor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerAccountId(String ownerAccountId);
}
