package com.moonkage.quotation.mapper;

import com.moonkage.quotation.dto.response.QuoteItemResponse;
import com.moonkage.quotation.dto.response.QuoteResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteItem;
import java.time.Instant;
import java.util.List;
import java.util.stream.IntStream;

public final class QuoteMapper {

    private QuoteMapper() {}

    /** @param previousRevisions null when they were not asked for */
    public static QuoteResponse toResponse(
            Quote quote, String vendorName, Instant now, List<QuoteResponse> previousRevisions) {
        return new QuoteResponse(
                quote.getId(),
                quote.getRequestId(),
                quote.getVendorId(),
                vendorName,
                quote.getRevisionNo(),
                quote.getSupersedesQuoteId(),
                toItemResponses(quote.getItems()),
                quote.getItemsAmount(),
                quote.getCustomSurcharge(),
                quote.getShippingFee(),
                quote.getTotalAmount(),
                quote.getDepositRate(),
                quote.getDepositAmount(),
                quote.getRemainingAmount(),
                quote.getDeliveryDate(),
                quote.getDeliveryMethod(),
                quote.getValidUntil(),
                quote.getNotes(),
                quote.getStatus(),
                quote.isAcceptableAt(now),
                quote.getSubmittedAt(),
                quote.getWithdrawnAt(),
                previousRevisions);
    }

    /** Line numbers start at 1, as quote_items.line_no. */
    public static List<QuoteItemResponse> toItemResponses(List<QuoteItem> items) {
        return IntStream.range(0, items.size())
                .mapToObj(i -> toItemResponse(i + 1, items.get(i)))
                .toList();
    }

    private static QuoteItemResponse toItemResponse(int lineNo, QuoteItem item) {
        return new QuoteItemResponse(
                lineNo,
                item.getKind(),
                item.getDescription(),
                item.getProductRef(),
                item.getCustomType(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getAmount());
    }
}
