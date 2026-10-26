package com.moonkage.payment.repository;

import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.enums.LedgerEntryKind;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    List<LedgerEntry> findByOrderIdOrderByCreatedAtAsc(String orderId);

    /** The payments that brought money to an order, newest first (a dispute refund goes back through one). */
    List<LedgerEntry> findByOrderIdAndKindOrderByCreatedAtDesc(String orderId, LedgerEntryKind kind);
}
