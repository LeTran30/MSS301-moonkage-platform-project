package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Ledger;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface LedgerRepository extends JpaRepository<Ledger, String> {

    /** Row lock: every write to one order's money goes one at a time (NFR-09). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Ledger l where l.orderId = :orderId")
    Optional<Ledger> findForUpdateByOrderId(String orderId);

    Optional<Ledger> findByOrderId(String orderId);

    /**
     * {@code vendorId} null = every vendor. {@code payableOnly}: received or past the complaint deadline, no open
     * dispute, not paid out yet (AC-48.1).
     */
    @Query("""
            select l from Ledger l
            where (:vendorId is null or l.vendorId = :vendorId)
              and (:payableOnly = false or (
                    exists (select s.orderId from OrderSnapshot s
                            where s.orderId = l.orderId and s.disputeOpen = false
                              and (s.receivedConfirmed = true or s.complaintDeadline < :now))
                    and not exists (select p.id from Payout p where p.orderId = l.orderId)))
            order by l.updatedAt desc, l.orderId
            """)
    Page<Ledger> search(String vendorId, boolean payableOnly, Instant now, Pageable page);
}
