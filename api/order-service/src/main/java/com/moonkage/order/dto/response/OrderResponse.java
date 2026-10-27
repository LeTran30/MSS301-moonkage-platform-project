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
 */
public record OrderResponse(
        String id,
        OrderKind kind,
        OrderStatus status,
        String buyerAccountId,
        String vendorId,
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
        Instant createdAt,
        List<Item> items) {

    public record Item(String productId, String productName, long unitPrice, int quantity, long subtotal) {}

    public record InvoiceInfoResponse(String name, String taxCode, String address, String email) {}
}
