package com.moonkage.quotation.dto.request;

import com.moonkage.quotation.enums.QuoteStatus;
import jakarta.validation.constraints.NotNull;

/** Only WITHDRAWN: a sent quote is never edited (BR-05). */
public record UpdateQuoteRequest(@NotNull QuoteStatus status) {}
