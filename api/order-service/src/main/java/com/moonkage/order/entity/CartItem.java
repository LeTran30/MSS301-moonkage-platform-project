package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Multi-shop cart line (FR-08). Grouped by vendor at display; re-checked at checkout.
 */
@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"buyer_account_id", "product_id"}))
@Getter
@Setter
@NoArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String buyerAccountId;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private Integer quantity;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
