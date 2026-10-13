package com.bake2b.order.entity;

import com.bake2b.order.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * One order per vendor; a multi-shop checkout creates several (A-01). Prices, commission and address are copied at creation (BR-19).
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String buyerUserId;

    @Column(nullable = false)
    private String vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderKind kind;

    /** Required for CUSTOM_ORDER. */
    private String quoteId;

    /** Shared by all orders split from one checkout payment (A-01). */
    private String checkoutId;

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

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate;

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

    @Column(nullable = false)
    private String deliveryAreaCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    /** Required for inter-province buy-now when shipping (AC-33.3). */
    private String trackingCode;

    /** Vendor-issued invoice file (FR-44, A-02). */
    private String invoiceFileUrl;

    private LocalDateTime deliveredAt;

    private LocalDateTime receivedConfirmedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
