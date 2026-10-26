package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Ledger;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface LedgerRepository extends JpaRepository<Ledger, String> {

    /** Row lock: every write to one order's money goes one at a time (NFR-09). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Ledger l where l.orderId = :orderId")
    Optional<Ledger> findForUpdateByOrderId(String orderId);

    Optional<Ledger> findByOrderId(String orderId);
}
