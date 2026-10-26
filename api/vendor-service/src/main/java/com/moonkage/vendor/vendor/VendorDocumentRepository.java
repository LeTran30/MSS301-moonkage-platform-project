package com.moonkage.vendor.vendor;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface VendorDocumentRepository extends JpaRepository<VendorDocument, String> {

    /** Oldest first: of several documents of one kind, the last is the current one. */
    List<VendorDocument> findByVendorIdOrderByUploadedAtAsc(String vendorId);

    Optional<VendorDocument> findByIdAndVendorId(String id, String vendorId);
}
