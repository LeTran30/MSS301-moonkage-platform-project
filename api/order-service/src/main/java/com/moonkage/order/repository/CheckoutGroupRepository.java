package com.moonkage.order.repository;

import com.moonkage.order.entity.CheckoutGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckoutGroupRepository extends JpaRepository<CheckoutGroup, CheckoutGroup.Key> {

    List<CheckoutGroup> findByCheckoutId(String checkoutId);
}
