package com.moonkage.quotation.entity;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.AcceptanceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/**
 * Binding copy of an accepted quote (L-10, D-11, D-12). The deposit is charged from this copy and order-service
 * creates the order from it, without calling quotation back. {@code snapshot}, {@code contentHash},
 * {@code depositAmount} and {@code quoteId} never change once written: a database trigger refuses it.
 */
@Entity
@Table(name = "quote_acceptances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuoteAcceptance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(name = "quote_id", nullable = false, updatable = false)
    private String quoteId;

    @Column(name = "request_id", nullable = false, updatable = false)
    private String requestId;

    @Column(name = "buyer_account_id", nullable = false, updatable = false, length = 36)
    private String buyerAccountId;

    @Column(name = "vendor_id", nullable = false, updatable = false, length = 36)
    private String vendorId;

    @Column(name = "buyer_legal_name", nullable = false, updatable = false, length = 100)
    private String buyerLegalName;

    @Column(name = "buyer_id_masked", nullable = false, updatable = false, length = 12)
    private String buyerIdMasked;

    @Column(name = "vendor_business_name", nullable = false, updatable = false)
    private String vendorBusinessName;

    @Column(name = "vendor_tax_code", nullable = false, updatable = false, length = 20)
    private String vendorTaxCode;

    /** Business invoice (FR-24): all four or none. */
    @Column(name = "invoice_name", updatable = false)
    private String invoiceName;

    @Column(name = "invoice_tax_code", updatable = false, length = 20)
    private String invoiceTaxCode;

    @Column(name = "invoice_address", updatable = false)
    private String invoiceAddress;

    @Column(name = "invoice_email", updatable = false)
    private String invoiceEmail;

    /** Canonical JSON whose SHA-256 is {@link #contentHash}. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, updatable = false, columnDefinition = "jsonb")
    private String snapshot;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "content_hash", nullable = false, updatable = false, length = 64)
    private String contentHash;

    @Column(name = "deposit_amount", nullable = false, updatable = false)
    private long depositAmount;

    /** payment-service's paymentId of the deposit. */
    @Column(name = "payment_ref", length = 64)
    private String paymentRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AcceptanceStatus status = AcceptanceStatus.PENDING_PAYMENT;

    @Column(name = "accepted_at", nullable = false, updatable = false)
    private Instant acceptedAt;

    @Column(name = "payment_expires_at", nullable = false, updatable = false)
    private Instant paymentExpiresAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static QuoteAcceptance pending(
            Quote quote, String buyerAccountId, AcceptanceParties parties, AcceptanceCopy copy, Instant now) {
        QuoteAcceptance acceptance = new QuoteAcceptance();
        acceptance.quoteId = quote.getId();
        acceptance.requestId = quote.getRequestId();
        acceptance.vendorId = quote.getVendorId();
        acceptance.depositAmount = quote.getDepositAmount();
        acceptance.buyerAccountId = buyerAccountId;
        acceptance.buyerLegalName = parties.buyerLegalName();
        acceptance.buyerIdMasked = parties.buyerIdMasked();
        acceptance.vendorBusinessName = parties.vendorBusinessName();
        acceptance.vendorTaxCode = parties.vendorTaxCode();
        if (parties.invoice() != null) {
            acceptance.invoiceName = parties.invoice().name();
            acceptance.invoiceTaxCode = parties.invoice().taxCode();
            acceptance.invoiceAddress = parties.invoice().address();
            acceptance.invoiceEmail = parties.invoice().email();
        }
        acceptance.snapshot = copy.json();
        acceptance.contentHash = copy.contentHash();
        acceptance.acceptedAt = now;
        acceptance.paymentExpiresAt = copy.paymentExpiresAt();
        return acceptance;
    }

    public boolean isPending() {
        return status == AcceptanceStatus.PENDING_PAYMENT;
    }

    public void attachPayment(String paymentId) {
        this.paymentRef = paymentId;
    }

    public void succeed(Instant paidAt) {
        requirePending(AcceptanceStatus.SUCCEEDED);
        this.status = AcceptanceStatus.SUCCEEDED;
        this.paidAt = paidAt;
    }

    public void fail() {
        requirePending(AcceptanceStatus.FAILED);
        this.status = AcceptanceStatus.FAILED;
    }

    private void requirePending(AcceptanceStatus target) {
        if (!isPending()) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, target);
        }
    }

    /** Who the agreement binds, as printed in the snapshot. */
    public record AcceptanceParties(
            String buyerLegalName,
            String buyerIdMasked,
            String vendorBusinessName,
            String vendorTaxCode,
            Invoice invoice) {}

    public record Invoice(String name, String taxCode, String address, String email) {}

    /** The frozen snapshot, its hash and how long the buyer has to pay the deposit. */
    public record AcceptanceCopy(String json, String contentHash, Instant paymentExpiresAt) {}
}
