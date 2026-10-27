package com.moonkage.order.dto.event;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * quote.accepted from quotation-service: the deposit succeeded. order-service creates the custom order from
 * {@code snapshot} without calling quotation back (D-12, L-10 step 6). Only the fields read here are declared.
 *
 * @param acceptanceId also the id of the custom order, which the deposit is booked on in payment-service
 * @param contentHash kept as agreement_hash
 */
public record QuoteAcceptedEvent(
        String eventId,
        Instant occurredAt,
        String acceptanceId,
        String quoteId,
        String requestId,
        String buyerAccountId,
        String vendorId,
        long depositAmount,
        String paymentId,
        String contentHash,
        Snapshot snapshot) {

    /** quotation's AgreementSnapshot: what the buyer agreed to. */
    public record Snapshot(RequestPart request, QuotePart quote, DeliveryPart delivery, InvoicePart invoice) {}

    public record RequestPart(String productId, int quantity, List<String> customTypes) {}

    public record QuotePart(
            String quoteId,
            List<LinePart> items,
            long itemsAmount,
            long customSurcharge,
            long shippingFee,
            long totalAmount,
            long depositAmount,
            long remainingAmount,
            LocalDate deliveryDate,
            String deliveryMethod) {}

    /** @param productRef the catalog product the line is for; null for a custom line */
    public record LinePart(
            int lineNo, String description, String productRef, int quantity, long unitPrice, long amount) {}

    public record DeliveryPart(
            String recipientName, String recipientPhone, String provinceCode, String addressDetail) {}

    /** null fields = personal invoice. */
    public record InvoicePart(String name, String taxCode, String address, String email) {}
}
