package com.moonkage.vendor.vendor;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface VendorReviewRepository extends JpaRepository<VendorReview, String> {

    List<VendorReview> findByVendorIdOrderByDecidedAtAsc(String vendorId);
}
