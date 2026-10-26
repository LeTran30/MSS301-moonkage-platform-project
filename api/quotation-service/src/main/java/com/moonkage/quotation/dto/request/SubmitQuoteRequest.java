package com.moonkage.quotation.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * FR-38. The server computes every total, the deposit and the remainder; the client sends no amount but the lines and
 * the shipping fee.
 *
 * @param depositRate percent, at most two decimals, 0 &lt; rate ≤ 100
 * @param validDays the quote stays valid this many days from now, 1 to 14 (Q-19)
 * @param supersedesQuoteId the vendor's previous quote this one replaces; it is withdrawn in the same transaction
 */
public record SubmitQuoteRequest(
        @NotEmpty @Valid List<QuoteItemRequest> items,
        @Valid List<CustomItemRequest> customItems,
        @NotNull @PositiveOrZero Long shippingFee,
        @NotNull BigDecimal depositRate,
        @NotNull LocalDate deliveryDate,
        @NotBlank @Size(max = 255) String deliveryMethod,
        @NotNull @Min(1) @Max(14) Integer validDays,
        @Size(max = 2000) String notes,
        @Size(max = 36) String supersedesQuoteId) {}
