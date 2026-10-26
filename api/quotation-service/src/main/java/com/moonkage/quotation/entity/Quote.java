package com.moonkage.quotation.entity;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.QuoteStatus;
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
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.ListIndexBase;

/**
 * A vendor's quote in the standard format (FR-38). Every amount is computed by the server and frozen on submit: a sent
 * quote never changes, only its status. A new price is a new revision that supersedes the old one (BR-05).
 */
@Entity
@Table(name = "quotes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "request_id", nullable = false)
    private String requestId;

    @Column(name = "vendor_id", nullable = false)
    private String vendorId;

    @Column(name = "revision_no", nullable = false)
    private int revisionNo;

    @Column(name = "supersedes_quote_id")
    private String supersedesQuoteId;

    /** quote_items.line_no starts at 1. */
    @ElementCollection
    @CollectionTable(name = "quote_items", joinColumns = @JoinColumn(name = "quote_id"))
    @OrderColumn(name = "line_no")
    @ListIndexBase(1)
    private List<QuoteItem> items = new ArrayList<>();

    @Column(name = "items_amount", nullable = false)
    private long itemsAmount;

    @Column(name = "custom_surcharge", nullable = false)
    private long customSurcharge;

    @Column(name = "shipping_fee", nullable = false)
    private long shippingFee;

    @Column(name = "total_amount", nullable = false)
    private long totalAmount;

    /** Percent, e.g. 30.00. */
    @Column(name = "deposit_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal depositRate;

    @Column(name = "deposit_amount", nullable = false)
    private long depositAmount;

    @Column(name = "remaining_amount", nullable = false)
    private long remainingAmount;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "delivery_method", nullable = false)
    private String deliveryMethod;

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteStatus status = QuoteStatus.SUBMITTED;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    /**
     * @param previous the quote this one replaces, or null for a first quote
     */
    public static Quote submit(String requestId, String vendorId, Quote previous, QuoteTerms terms, Instant now) {
        Quote quote = new Quote();
        quote.requestId = requestId;
        quote.vendorId = vendorId;
        quote.revisionNo = previous == null ? 1 : previous.revisionNo + 1;
        quote.supersedesQuoteId = previous == null ? null : previous.id;
        quote.items = new ArrayList<>(terms.items());
        quote.itemsAmount = terms.itemsAmount();
        quote.customSurcharge = terms.customSurcharge();
        quote.shippingFee = terms.shippingFee();
        quote.totalAmount = terms.totalAmount();
        quote.depositRate = terms.depositRate();
        quote.depositAmount = terms.depositAmount();
        quote.remainingAmount = terms.remainingAmount();
        quote.deliveryDate = terms.deliveryDate();
        quote.deliveryMethod = terms.deliveryMethod();
        quote.validUntil = terms.validUntil();
        quote.notes = terms.notes();
        quote.submittedAt = now;
        return quote;
    }

    public boolean isSubmitted() {
        return status == QuoteStatus.SUBMITTED;
    }

    /** AC-17.3: past its validity a quote cannot be accepted, even before the expiry job marks it. */
    public boolean isAcceptableAt(Instant now) {
        return isSubmitted() && now.isBefore(validUntil);
    }

    public void withdraw(Instant now) {
        requireSubmitted(QuoteStatus.WITHDRAWN);
        this.status = QuoteStatus.WITHDRAWN;
        this.withdrawnAt = now;
    }

    public void accept() {
        requireSubmitted(QuoteStatus.ACCEPTED);
        this.status = QuoteStatus.ACCEPTED;
    }

    /** BR-17: another quote of the request was accepted. */
    public void close() {
        requireSubmitted(QuoteStatus.CLOSED);
        this.status = QuoteStatus.CLOSED;
    }

    private void requireSubmitted(QuoteStatus target) {
        if (!isSubmitted()) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, target);
        }
    }
}
