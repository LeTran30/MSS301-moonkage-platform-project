package com.moonkage.vendor.vendor;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface OrderProfileRepository extends JpaRepository<OrderProfile, String> {

    Optional<OrderProfile> findByVendorId(String vendorId);
}
