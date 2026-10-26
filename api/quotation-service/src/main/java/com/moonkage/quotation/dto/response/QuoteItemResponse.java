package com.moonkage.quotation.dto.response;

import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.QuoteItemKind;

public record QuoteItemResponse(
        int lineNo,
        QuoteItemKind kind,
        String description,
        String productRef,
        CustomType customType,
        int quantity,
        long unitPrice,
        long amount) {}
