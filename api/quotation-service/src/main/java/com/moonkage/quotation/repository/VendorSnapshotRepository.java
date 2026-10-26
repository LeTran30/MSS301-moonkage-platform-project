package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.VendorSnapshot;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorSnapshotRepository extends JpaRepository<VendorSnapshot, String> {

    /** One account owns at most one vendor (L-14). */
    Optional<VendorSnapshot> findFirstByOwnerAccountId(String ownerAccountId);

    /** Candidates for an open request and the supplier list (BR-16, FR-14); the finer match runs in Java. */
    List<VendorSnapshot> findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc();
}
