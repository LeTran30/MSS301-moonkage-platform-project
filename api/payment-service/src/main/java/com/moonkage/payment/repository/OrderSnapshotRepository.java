package com.moonkage.payment.repository;

import com.moonkage.payment.entity.OrderSnapshot;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface OrderSnapshotRepository extends JpaRepository<OrderSnapshot, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from OrderSnapshot s where s.orderId = :orderId")
    Optional<OrderSnapshot> findForUpdateByOrderId(String orderId);
}
