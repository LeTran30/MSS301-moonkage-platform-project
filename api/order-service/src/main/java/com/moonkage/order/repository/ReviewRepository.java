package com.moonkage.order.repository;

import com.moonkage.order.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByOrderIdOrderByCreatedAtAsc(String orderId);

    boolean existsByOrderIdAndProductId(String orderId, String productId);
}
