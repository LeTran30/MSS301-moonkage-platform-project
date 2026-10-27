package com.moonkage.order.entity;

import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/**
 * One order per vendor; a multi-shop checkout creates several (A-01).
 * Prices, delivery fee and address are copied at creation (BR-19).
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    /** Issued before the order exists: by the checkout (P-01) or the quote acceptance (D-12); else on persist. */
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String buyerAccountId;

    @Column(nullable = false)
    private String vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderKind kind;

    /** Required for CUSTOM_ORDER. */
    private String quoteId;

    /** The checkout that paid it: shared by all orders split from one checkout payment (A-01, BR-29). */
    private String paymentGroupId;

    /** CUSTOM_ORDER: the quote acceptance and the hash of the agreed content (L-10). */
    @Column(length = 36)
    private String agreementId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 64)
    private String agreementHash;

    @Column(nullable = false)
    private Long itemsAmount;

    @Column(nullable = false)
    private Long shippingFee = 0L;

    @Column(nullable = false)
    private Long discountAmount = 0L;

    private String voucherCode;

    @Column(nullable = false)
    private Long totalAmount;

    /** CUSTOM_ORDER only: total x deposit rate (AC-19.2). */
    private Long depositAmount;

    /** CUSTOM_ORDER only: total - deposit. */
    private Long remainingAmount;

    @Column(nullable = false)
    private boolean interprovince;

    /** CUSTOM_ORDER with custom work: must pass mockup approval (BR-15). */
    @Column(nullable = false)
    private boolean hasCustom;

    /** Null = personal invoice (AC-24.5). */
    @Embedded
    private InvoiceInfo invoiceInfo;

    @Column(nullable = false)
    private String deliveryAddressDetail;

    @Column(nullable = false, length = 2)
    private String deliveryProvinceCode;

    @Column(length = 100)
    private String recipientName;

    @Column(length = 10)
    private String recipientPhone;

    /** CUSTOM_ORDER: the delivery date and method of the accepted quote. */
    private LocalDate deliveryDate;

    @Column(length = 100)
    private String deliveryMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    /** Required for inter-province buy-now when shipping (AC-33.3). */
    private String trackingCode;

    /** Vendor-issued invoice file (FR-44, A-02). */
    private String invoiceObjectKey;

    private Instant deliveredAt;

    private Instant receivedConfirmedAt;

    /** The buyer can complain until then (BR-18); payout waits for it. */
    private Instant complaintDeadline;

    /** Set once payment-service locks the payout (P-02); a dispute can no longer open. */
    private Instant payoutLockedAt;

    @Version
    @Column(nullable = false)
    private long version;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @PrePersist
    void assignId() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
