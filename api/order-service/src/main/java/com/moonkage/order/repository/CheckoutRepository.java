package com.moonkage.order.repository;

import com.moonkage.order.entity.Checkout;
import com.moonkage.order.enums.CheckoutStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface CheckoutRepository extends JpaRepository<Checkout, String> {

    /** Row lock: a payment event and the expiry job never change one checkout at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Checkout c where c.id = :id")
    Optional<Checkout> findForUpdateById(String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Checkout c where c.status = :status and c.expiresAt < :now order by c.expiresAt")
    List<Checkout> findForUpdateByStatusAndExpiresAtBefore(CheckoutStatus status, Instant now, Pageable page);
}
