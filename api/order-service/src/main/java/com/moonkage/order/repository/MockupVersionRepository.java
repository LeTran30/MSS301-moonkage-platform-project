package com.moonkage.order.repository;

import com.moonkage.order.entity.MockupVersion;
import com.moonkage.order.enums.MockupReviewStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MockupVersionRepository extends JpaRepository<MockupVersion, String> {

    boolean existsByOrderIdAndReviewStatus(String orderId, MockupReviewStatus reviewStatus);

    List<MockupVersion> findByOrderIdOrderByVersionNoAsc(String orderId);

    Optional<MockupVersion> findByOrderIdAndVersionNo(String orderId, Integer versionNo);

    long countByOrderId(String orderId);
}
