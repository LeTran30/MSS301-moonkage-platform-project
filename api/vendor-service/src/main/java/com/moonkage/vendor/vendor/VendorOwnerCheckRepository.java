package com.moonkage.vendor.vendor;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface VendorOwnerCheckRepository extends JpaRepository<VendorOwnerCheck, String> {

    List<VendorOwnerCheck> findByVendorIdOrderBySubmissionNoAsc(String vendorId);

    /** The check of the submission now under review (AC-45.4). */
    Optional<VendorOwnerCheck> findFirstByVendorIdOrderBySubmissionNoDesc(String vendorId);
}
