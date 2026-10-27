package com.moonkage.order.repository;

import com.moonkage.order.entity.CheckoutLine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckoutLineRepository extends JpaRepository<CheckoutLine, CheckoutLine.Key> {

    List<CheckoutLine> findByCheckoutIdOrderByLineNo(String checkoutId);
}
