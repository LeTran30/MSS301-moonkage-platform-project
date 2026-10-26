package com.moonkage.vendor.product;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

interface StockReservationRepository extends JpaRepository<StockReservation, String> {

    List<StockReservation> findByCheckoutIdOrderByProductId(String checkoutId);

    /** The lines of a checkout, locked: commit, release and the sweep of one checkout run one at a time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM StockReservation r WHERE r.checkoutId = :checkoutId ORDER BY r.productId")
    List<StockReservation> findForChangeByCheckoutId(String checkoutId);

    /** Checkouts with a line of {@code status} past its expiry (ix_stock_reservations_held), oldest first. */
    @Query("SELECT r.checkoutId FROM StockReservation r WHERE r.status = :status AND r.expiresAt < :now"
            + " GROUP BY r.checkoutId ORDER BY MIN(r.expiresAt)")
    List<String> findExpiredCheckoutIds(ReservationStatus status, Instant now, Pageable page);
}
