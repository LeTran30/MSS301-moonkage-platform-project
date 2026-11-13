package com.moonkage.payment.repository;

import com.moonkage.payment.entity.DisbursementRequest;
import com.moonkage.payment.enums.DisbursementStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface DisbursementRequestRepository extends JpaRepository<DisbursementRequest, String> {

    List<DisbursementRequest> findByOrderIdOrderByCreatedAtAsc(String orderId);

    Optional<DisbursementRequest> findByOrderIdAndIdempotencyKey(String orderId, String idempotencyKey);

    @Query("""
            select d from DisbursementRequest d
            where (:vendorId is null or d.vendorId = :vendorId)
              and (:status is null or d.status = :status)
            order by d.createdAt desc, d.id desc
            """)
    Page<DisbursementRequest> search(String vendorId, DisbursementStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from DisbursementRequest d where d.id = :id and d.orderId = :orderId")
    Optional<DisbursementRequest> findForUpdate(String orderId, String id);

    /** AC-41.2: what is still waiting counts against the deposit held. */
    @Query("""
            select coalesce(sum(d.amount), 0) from DisbursementRequest d
            where d.orderId = :orderId and d.status = :status
            """)
    long sumAmountByOrderIdAndStatus(String orderId, DisbursementStatus status);
}
