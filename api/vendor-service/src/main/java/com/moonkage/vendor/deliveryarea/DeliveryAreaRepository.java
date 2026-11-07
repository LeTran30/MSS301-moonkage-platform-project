package com.moonkage.vendor.vendor;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface DeliveryAreaRepository extends JpaRepository<DeliveryArea, String> {

    List<DeliveryArea> findByVendorId(String vendorId);
}
