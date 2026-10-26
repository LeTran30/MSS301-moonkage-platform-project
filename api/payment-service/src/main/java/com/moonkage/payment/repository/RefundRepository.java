package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.RefundReason;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundRepository extends JpaRepository<Refund, String> {

    boolean existsByOriginalPaymentIdAndReason(String originalPaymentId, RefundReason reason);
}
