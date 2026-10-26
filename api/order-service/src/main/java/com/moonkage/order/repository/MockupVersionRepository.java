package com.moonkage.order.repository;

import com.moonkage.order.entity.MockupVersion;
import com.moonkage.order.enums.MockupReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MockupVersionRepository extends JpaRepository<MockupVersion, String> {

    boolean existsByOrderIdAndReviewStatus(String orderId, MockupReviewStatus reviewStatus);
}
