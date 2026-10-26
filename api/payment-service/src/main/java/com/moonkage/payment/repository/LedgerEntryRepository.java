package com.moonkage.payment.repository;

import com.moonkage.payment.entity.LedgerEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    List<LedgerEntry> findByOrderIdOrderByCreatedAtAsc(String orderId);
}
