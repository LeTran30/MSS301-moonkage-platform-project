package com.moonkage.quotation.entity;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.RequestStatus;
import com.moonkage.quotation.enums.RequestType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Buyer request for quotes, direct to one vendor (FR-15) or open to many (FR-16). The delivery address is copied in,
 * so a later change in the buyer's address book does not move an agreed delivery.
 */
@Entity
@Table(name = "quote_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuoteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "buyer_account_id", nullable = false)
    private String buyerAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    /** Required when type = DIRECT. */
    @Column(name = "target_vendor_id")
    private String targetVendorId;

    @Column(name = "product_id")
    private String productId;

    @Column(nullable = false)
    private int quantity;

    /** VND, optional. */
    private Long budget;

    @Column(name = "delivery_deadline", nullable = false)
    private LocalDate deliveryDeadline;

    @Column(name = "delivery_recipient_name", length = 100)
    private String deliveryRecipientName;

    @Column(name = "delivery_recipient_phone", length = 10)
    private String deliveryRecipientPhone;

    @Column(name = "delivery_province_code", nullable = false, length = 2)
    private String deliveryProvinceCode;

    @Column(name = "delivery_address_detail", nullable = false)
    private String deliveryAddressDetail;

    @ElementCollection
    @CollectionTable(name = "request_custom_types", joinColumns = @JoinColumn(name = "request_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "custom_type", nullable = false)
    private Set<CustomType> customTypes = new HashSet<>();

    @Column(name = "custom_spec", columnDefinition = "TEXT")
    private String customSpec;

    /** Set when created by 're-order' (FR-23, deferred). */
    @Column(name = "source_order_id")
    private String sourceOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    /** What the buyer asks for; delivery is set separately with {@link #deliverTo}. */
    public static QuoteRequest open(
            String buyerAccountId,
            RequestType type,
            String targetVendorId,
            String productId,
            int quantity,
            Long budget,
            LocalDate deliveryDeadline) {
        QuoteRequest request = new QuoteRequest();
        request.buyerAccountId = buyerAccountId;
        request.type = type;
        request.targetVendorId = targetVendorId;
        request.productId = productId;
        request.quantity = quantity;
        request.budget = budget;
        request.deliveryDeadline = deliveryDeadline;
        return request;
    }

    public void deliverTo(String recipientName, String recipientPhone, String provinceCode, String addressDetail) {
        this.deliveryRecipientName = recipientName;
        this.deliveryRecipientPhone = recipientPhone;
        this.deliveryProvinceCode = provinceCode;
        this.deliveryAddressDetail = addressDetail;
    }

    public void customize(Set<CustomType> types, String spec) {
        this.customTypes = types.isEmpty() ? new HashSet<>() : EnumSet.copyOf(types);
        this.customSpec = spec;
    }

    public boolean isOwnedBy(String accountId) {
        return buyerAccountId.equals(accountId);
    }

    public boolean isOpen() {
        return status == RequestStatus.OPEN;
    }

    /** BR-17: one quote won, the request takes no more quotes. */
    public void award() {
        if (!isOpen()) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, RequestStatus.AWARDED);
        }
        this.status = RequestStatus.AWARDED;
    }
}
