package com.moonkage.order.dto.response;

import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * An order with its lines, delivery address and business invoice data (FR-10, FR-21, AC-32.1). {@code items} is
 * empty in a list.
 *
 * @param paymentGroupId the checkout that paid it; buy-now orders of one checkout share it (BR-29)
 * @param invoiceInfo null = personal invoice
 * @param vendorName the Shop's name on the day of the order; null on older orders
 * @param disputeOpen a dispute of the order waits for the admin's decision (FR-12, FR-49)
 */
public record OrderResponse(
        String id,
        OrderKind kind,
        OrderStatus status,
        String buyerAccountId,
        String vendorId,
        String vendorName,
        String paymentGroupId,
        String quoteId,
        long itemsAmount,
        long shippingFee,
        long discountAmount,
        long totalAmount,
        Long depositAmount,
        Long remainingAmount,
        boolean interprovince,
        boolean hasCustom,
        String recipientName,
        String recipientPhone,
        String provinceCode,
        String addressDetail,
        LocalDate deliveryDate,
        String deliveryMethod,
        String trackingCode,
        InvoiceInfoResponse invoiceInfo,
        boolean hasInvoiceFile,
        Instant deliveredAt,
        Instant receivedConfirmedAt,
        Instant complaintDeadline,
        boolean disputeOpen,
        Instant createdAt,
        List<Item> items) {

    /** @param imageUrl the product's cover on the day of the order; null for a custom line or an older order */
    public record Item(
            String productId, String productName, String imageUrl, long unitPrice, int quantity, long subtotal) {}

    public record InvoiceInfoResponse(String name, String taxCode, String address, String email) {}
}
