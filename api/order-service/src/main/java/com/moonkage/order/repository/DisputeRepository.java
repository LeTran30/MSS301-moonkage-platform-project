package com.moonkage.order.repository;

import com.moonkage.order.entity.Dispute;
import com.moonkage.order.enums.DisputeStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeRepository extends JpaRepository<Dispute, String> {

    boolean existsByOrderIdAndStatus(String orderId, DisputeStatus status);

    /** The latest dispute of an order: the open one, else the last resolved. */
    Optional<Dispute> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);
}
