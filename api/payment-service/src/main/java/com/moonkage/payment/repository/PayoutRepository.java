package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutRepository extends JpaRepository<Payout, String> {

    boolean existsByOrderId(String orderId);
}
