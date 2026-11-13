package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Payout;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutRepository extends JpaRepository<Payout, String> {

    boolean existsByOrderId(String orderId);

    Optional<Payout> findByOrderId(String orderId);
}
