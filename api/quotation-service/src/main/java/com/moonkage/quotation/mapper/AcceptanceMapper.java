package com.moonkage.quotation.mapper;

import com.moonkage.quotation.dto.event.AgreementSnapshot;
import com.moonkage.quotation.dto.response.AcceptQuoteResponse;
import com.moonkage.quotation.dto.response.AcceptanceResponse;
import com.moonkage.quotation.dto.response.QuoteItemResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteAcceptance;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceParties;
import com.moonkage.quotation.entity.QuoteAcceptance.Invoice;
import com.moonkage.quotation.entity.QuoteRequest;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public final class AcceptanceMapper {

    private AcceptanceMapper() {}

    public static AcceptQuoteResponse toAcceptResponse(QuoteAcceptance acceptance, String paymentUrl) {
        return new AcceptQuoteResponse(
                acceptance.getId(),
                acceptance.getStatus(),
                acceptance.getDepositAmount(),
                acceptance.getPaymentRef(),
                paymentUrl,
                acceptance.getPaymentExpiresAt());
    }

    public static AcceptanceResponse toResponse(QuoteAcceptance acceptance) {
        return new AcceptanceResponse(
                acceptance.getId(),
                acceptance.getQuoteId(),
                acceptance.getRequestId(),
                acceptance.getStatus(),
                acceptance.getDepositAmount(),
                acceptance.getContentHash(),
                acceptance.getSnapshot(),
                acceptance.getAcceptedAt(),
                acceptance.getPaymentExpiresAt(),
                acceptance.getPaidAt());
    }

    public static AgreementSnapshot toSnapshot(
            QuoteRequest request, Quote quote, String buyerAccountId, AcceptanceParties parties, Instant acceptedAt) {
        return new AgreementSnapshot(
                AgreementSnapshot.CURRENT_VERSION,
                acceptedAt,
                toRequestPart(request),
                toQuotePart(quote),
                new AgreementSnapshot.DeliveryPart(
                        request.getDeliveryRecipientName(),
                        request.getDeliveryRecipientPhone(),
                        request.getDeliveryProvinceCode(),
                        request.getDeliveryAddressDetail()),
                new AgreementSnapshot.BuyerPart(buyerAccountId, parties.buyerLegalName(), parties.buyerIdMasked()),
                new AgreementSnapshot.VendorPart(
                        quote.getVendorId(), parties.vendorBusinessName(), parties.vendorTaxCode()),
                toInvoicePart(parties.invoice()));
    }

    private static AgreementSnapshot.RequestPart toRequestPart(QuoteRequest request) {
        return new AgreementSnapshot.RequestPart(
                request.getId(),
                request.getType(),
                request.getProductId(),
                request.getQuantity(),
                request.getCustomTypes().stream()
                        .sorted(Comparator.naturalOrder())
                        .toList(),
                request.getCustomSpec(),
                request.getDeliveryDeadline());
    }

    private static AgreementSnapshot.QuotePart toQuotePart(Quote quote) {
        List<AgreementSnapshot.LinePart> lines = QuoteMapper.toItemResponses(quote.getItems()).stream()
                .map(AcceptanceMapper::toLinePart)
                .toList();
        return new AgreementSnapshot.QuotePart(
                quote.getId(),
                quote.getRevisionNo(),
                lines,
                quote.getItemsAmount(),
                quote.getCustomSurcharge(),
                quote.getShippingFee(),
                quote.getTotalAmount(),
                quote.getDepositRate().toPlainString(),
                quote.getDepositAmount(),
                quote.getRemainingAmount(),
                quote.getDeliveryDate(),
                quote.getDeliveryMethod(),
                quote.getValidUntil(),
                quote.getNotes());
    }

    private static AgreementSnapshot.LinePart toLinePart(QuoteItemResponse item) {
        return new AgreementSnapshot.LinePart(
                item.lineNo(),
                item.kind(),
                item.description(),
                item.productRef(),
                item.customType(),
                item.quantity(),
                item.unitPrice(),
                item.amount());
    }

    private static AgreementSnapshot.InvoicePart toInvoicePart(Invoice invoice) {
        if (invoice == null) {
            return null;
        }
        return new AgreementSnapshot.InvoicePart(invoice.name(), invoice.taxCode(), invoice.address(), invoice.email());
    }
}
