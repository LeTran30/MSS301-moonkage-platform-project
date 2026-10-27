package com.moonkage.order.repository;

import com.moonkage.order.entity.CartItem;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface CartItemRepository extends JpaRepository<CartItem, String> {

    List<CartItem> findByBuyerAccountIdOrderByCreatedAtAsc(String buyerAccountId);

    Optional<CartItem> findByBuyerAccountIdAndProductId(String buyerAccountId, String productId);

    Optional<CartItem> findByIdAndBuyerAccountId(String id, String buyerAccountId);

    /** The products a successful checkout bought leave the cart (FR-09). */
    @Modifying
    @Query("delete from CartItem c where c.buyerAccountId = :buyerAccountId and c.productId in :productIds")
    int deleteBought(String buyerAccountId, Collection<String> productIds);
}
