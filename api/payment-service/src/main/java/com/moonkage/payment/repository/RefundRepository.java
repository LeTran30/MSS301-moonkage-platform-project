package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface RefundRepository extends JpaRepository<Refund, String> {

    boolean existsByOriginalPaymentIdAndReason(String originalPaymentId, RefundReason reason);

    boolean existsByDisputeId(String disputeId);

    List<Refund> findByOrderIdOrderByCreatedAtAsc(String orderId);

    Page<Refund> findByStatusOrderByCreatedAtAsc(RefundStatus status, Pageable page);

    /** Refunds of the order's money still waiting: a payout waits for them. */
    boolean existsByOrderIdAndStatusIn(String orderId, Collection<RefundStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Refund r where r.status = :status order by r.createdAt")
    List<Refund> findForUpdateByStatus(RefundStatus status, Pageable page);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Refund r where r.id = :id")
    Optional<Refund> findForUpdateById(String id);
}
