package com.moonkage.quotation.entity;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.QuoteItemKind;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * The money and delivery terms of a quote, computed from its lines (L-10): the client never sends a total.
 * {@code total = items + customSurcharge + shippingFee} (shipping is inside the total, BR-30);
 * {@code deposit = floor(total × rate / 100)}, rounded down to the đồng; {@code remaining = total − deposit}.
 * The same formulas are CHECK constraints on quotes.
 */
public record QuoteTerms(
        List<QuoteItem> items,
        long itemsAmount,
        long customSurcharge,
        long shippingFee,
        long totalAmount,
        BigDecimal depositRate,
        long depositAmount,
        long remainingAmount,
        LocalDate deliveryDate,
        String deliveryMethod,
        Instant validUntil,
        String notes) {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final int RATE_SCALE = 2;

    public QuoteTerms {
        items = List.copyOf(items);
    }

    public static QuoteTerms compute(
            List<QuoteItem> items,
            long shippingFee,
            BigDecimal depositRate,
            LocalDate deliveryDate,
            String deliveryMethod,
            Instant validUntil,
            String notes) {
        if (items.stream().noneMatch(i -> i.getKind() == QuoteItemKind.PRODUCT)) {
            throw new AppException(ErrorCode.INVALID_QUOTE_LINES, "cần ít nhất một dòng sản phẩm");
        }
        if (shippingFee < 0) {
            throw new AppException(ErrorCode.INVALID_QUOTE_LINES, "phí giao không được âm");
        }
        long itemsAmount = sum(items, QuoteItemKind.PRODUCT);
        long customSurcharge = sum(items, QuoteItemKind.CUSTOM);
        long total = Math.addExact(Math.addExact(itemsAmount, customSurcharge), shippingFee);
        BigDecimal rate = normalizeRate(depositRate);
        long deposit = depositOf(total, rate);
        if (deposit <= 0) {
            throw new AppException(ErrorCode.INVALID_DEPOSIT);
        }
        return new QuoteTerms(
                items,
                itemsAmount,
                customSurcharge,
                shippingFee,
                total,
                rate,
                deposit,
                total - deposit,
                deliveryDate,
                deliveryMethod,
                validUntil,
                notes);
    }

    static long depositOf(long total, BigDecimal rate) {
        return BigDecimal.valueOf(total)
                .multiply(rate)
                .divide(HUNDRED, 0, RoundingMode.FLOOR)
                .longValueExact();
    }

    private static long sum(List<QuoteItem> items, QuoteItemKind kind) {
        return items.stream()
                .filter(i -> i.getKind() == kind)
                .mapToLong(QuoteItem::getAmount)
                .reduce(0L, Math::addExact);
    }

    /** deposit_rate is numeric(5,2): more than two decimals would be rounded by the database, so refuse it. */
    private static BigDecimal normalizeRate(BigDecimal rate) {
        if (rate == null
                || rate.signum() <= 0
                || rate.compareTo(HUNDRED) > 0
                || rate.stripTrailingZeros().scale() > RATE_SCALE) {
            throw new AppException(ErrorCode.INVALID_DEPOSIT);
        }
        return rate.setScale(RATE_SCALE, RoundingMode.UNNECESSARY);
    }
}
