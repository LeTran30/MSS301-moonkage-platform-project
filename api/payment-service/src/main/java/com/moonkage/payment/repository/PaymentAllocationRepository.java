package com.moonkage.payment.repository;

import com.moonkage.payment.entity.PaymentAllocation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, PaymentAllocation.Key> {

    List<PaymentAllocation> findByPaymentId(String paymentId);
}
