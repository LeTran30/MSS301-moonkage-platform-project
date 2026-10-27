package com.moonkage.order.entity;

import com.moonkage.order.enums.CheckoutStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * The waiting room of a buy-now payment (D-10): not an order. Orders are created from it only once the payment
 * succeeded (FR-09); its id is the payment_group_id of those orders (BR-29).
 */
@Entity
@Table(name = "checkouts")
@Getter
@Setter
@NoArgsConstructor
public class Checkout {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 36)
    private String buyerAccountId;

    @Column(nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, length = 10)
    private String recipientPhone;

    @Column(nullable = false, length = 2)
    private String provinceCode;

    @Column(nullable = false)
    private String addressDetail;

    /** Entered once, copied to every order of the checkout (BR-29); null = personal invoice. */
    @Embedded
    private InvoiceInfo invoiceInfo;

    /** Items and delivery fees of every Shop, what the payment asks for. */
    @Column(nullable = false)
    private Long totalAmount;

    @Column(length = 36)
    private String paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CheckoutStatus status;

    /** The payment deadline plus a grace; the stock is held until then (P-01). */
    @Column(nullable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
