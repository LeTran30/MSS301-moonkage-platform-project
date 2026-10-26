package com.moonkage.quotation.dto.event;

import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.QuoteItemKind;
import com.moonkage.quotation.enums.RequestType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Content of quote_acceptances.snapshot: everything the buyer agreed to, as it was at acceptance (L-10 step 3).
 * Written once as canonical JSON (keys sorted) and hashed; order-service and later disputes (FR-49) read only this.
 *
 * @param version format of this snapshot, raised when a field changes meaning
 */
public record AgreementSnapshot(
        int version,
        Instant acceptedAt,
        RequestPart request,
        QuotePart quote,
        DeliveryPart delivery,
        BuyerPart buyer,
        VendorPart vendor,
        InvoicePart invoice) {

    public static final int CURRENT_VERSION = 1;

    public record RequestPart(
            String requestId,
            RequestType type,
            String productId,
            int quantity,
            List<CustomType> customTypes,
            String customSpec,
            LocalDate deliveryDeadline) {}

    /** @param depositRate as text ("30.00") so the hash does not depend on how a number is printed */
    public record QuotePart(
            String quoteId,
            int revisionNo,
            List<LinePart> items,
            long itemsAmount,
            long customSurcharge,
            long shippingFee,
            long totalAmount,
            String depositRate,
            long depositAmount,
            long remainingAmount,
            LocalDate deliveryDate,
            String deliveryMethod,
            Instant validUntil,
            String notes) {}

    public record LinePart(
            int lineNo,
            QuoteItemKind kind,
            String description,
            String productRef,
            CustomType customType,
            int quantity,
            long unitPrice,
            long amount) {}

    public record DeliveryPart(
            String recipientName, String recipientPhone, String provinceCode, String addressDetail) {}

    /** Masked ID number only (NFR-03). */
    public record BuyerPart(String accountId, String legalName, String idNumberMasked) {}

    public record VendorPart(String vendorId, String businessName, String taxCode) {}

    public record InvoicePart(String name, String taxCode, String address, String email) {}
}
