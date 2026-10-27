package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The part of a checkout one Shop sells: one delivery fee, and the id of the order it becomes, issued now so the
 * payment is split by order from the start and a repeated IPN creates the same orders (BR-29, BR-30, P-01).
 */
@Entity
@Table(name = "checkout_groups")
@IdClass(CheckoutGroup.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class CheckoutGroup {

    @Id
    @Column(name = "checkout_id", length = 36)
    private String checkoutId;

    @Id
    @Column(name = "vendor_id", length = 36)
    private String vendorId;

    @Column(nullable = false, unique = true, length = 36)
    private String orderId;

    @Column(nullable = false)
    private Long itemsAmount;

    @Column(nullable = false)
    private Long shippingFee;

    @Column(nullable = false)
    private boolean interprovince;

    public long totalAmount() {
        return itemsAmount + shippingFee;
    }

    @EqualsAndHashCode
    @NoArgsConstructor
    public static class Key implements Serializable {
        private static final long serialVersionUID = 1L;

        private String checkoutId;
        private String vendorId;
    }
}
