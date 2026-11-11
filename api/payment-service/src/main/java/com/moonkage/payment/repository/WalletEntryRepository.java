package com.moonkage.payment.repository;

import com.moonkage.payment.entity.WalletEntry;
import com.moonkage.payment.enums.WalletEntryReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletEntryRepository extends JpaRepository<WalletEntry, String> {

    Page<WalletEntry> findByAccountIdOrderByCreatedAtDesc(String accountId, Pageable pageable);

    boolean existsByReasonAndReferenceId(WalletEntryReason reason, String referenceId);
}
