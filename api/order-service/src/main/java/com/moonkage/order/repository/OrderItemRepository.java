package com.moonkage.order.repository;

import com.moonkage.order.entity.OrderItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {

    List<OrderItem> findByOrderId(String orderId);

    /** Items of a whole page of orders in one query, so listing orders is not one query per order. */
    List<OrderItem> findByOrderIdIn(Collection<String> orderIds);
}
