package com.moonkage.order.repository;

import com.moonkage.order.entity.ProgressUpdate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgressUpdateRepository extends JpaRepository<ProgressUpdate, String> {

    List<ProgressUpdate> findByOrderIdOrderByCreatedAtAsc(String orderId);
}
