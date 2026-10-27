package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    /** Row lock: two deliveries of the same IPN are handled one after the other (BR-25). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.gatewayTxnRef = :gatewayTxnRef")
    Optional<Payment> findForUpdateByGatewayTxnRef(String gatewayTxnRef);

    Optional<Payment> findByGatewayTxnRef(String gatewayTxnRef);

    /** Admin list (AC-51.3), newest first; {@code purpose} null = every purpose. */
    @Query("""
            select p from Payment p
            where (:purpose is null or p.purpose = :purpose)
              and p.createdAt >= :from and p.createdAt < :to
            order by p.createdAt desc, p.id
            """)
    Page<Payment> search(PaymentPurpose purpose, Instant from, Instant to, Pageable page);

    boolean existsByPurposeAndReferenceIdAndStatus(PaymentPurpose purpose, String referenceId, PaymentStatus status);

    /** PENDING payments past their deadline, oldest first, locked so two sweeps do not fail one twice. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.status = :status and p.expiresAt < :now order by p.expiresAt")
    List<Payment> findForUpdateByStatusAndExpiresAtBefore(PaymentStatus status, Instant now, Pageable page);
}
