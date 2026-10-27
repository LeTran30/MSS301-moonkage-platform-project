package com.moonkage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * The part of a payment that belongs to one order (BR-29). Written with the payment, so the database can check at
 * commit that a successful payment is split exactly (P-04). A registration fee has none.
 */
@Entity
@Table(name = "payment_allocations")
@IdClass(PaymentAllocation.Key.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentAllocation {

    @Id
    @Column(name = "payment_id", nullable = false)
    private String paymentId;

    /** orders.id in order-service; no FK across services. */
    @Id
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(nullable = false)
    private Long amount;

    public PaymentAllocation(String paymentId, String orderId, long amount) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.amount = amount;
    }

    @EqualsAndHashCode
    @NoArgsConstructor
    public static class Key implements Serializable {
        private static final long serialVersionUID = 1L;

        private String paymentId;
        private String orderId;
    }
}
