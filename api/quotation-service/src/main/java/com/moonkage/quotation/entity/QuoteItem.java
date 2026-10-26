package com.moonkage.quotation.entity;

import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.QuoteItemKind;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One line of a quote; {@code amount = quantity × unitPrice}, checked again by the database. */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuoteItem {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private QuoteItemKind kind;

    @Column(nullable = false)
    private String description;

    /** Product of the vendor this line is about, when there is one. */
    @Column(name = "product_ref", length = 36)
    private String productRef;

    /** Only on CUSTOM lines (BR-14). */
    @Enumerated(EnumType.STRING)
    @Column(name = "custom_type", length = 20)
    private CustomType customType;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private long unitPrice;

    @Column(nullable = false)
    private long amount;

    public static QuoteItem product(String description, String productRef, int quantity, long unitPrice) {
        return line(QuoteItemKind.PRODUCT, description, productRef, null, quantity, unitPrice);
    }

    public static QuoteItem custom(CustomType customType, String description, int quantity, long unitPrice) {
        return line(QuoteItemKind.CUSTOM, description, null, customType, quantity, unitPrice);
    }

    private static QuoteItem line(
            QuoteItemKind kind,
            String description,
            String productRef,
            CustomType customType,
            int quantity,
            long unitPrice) {
        QuoteItem item = new QuoteItem();
        item.kind = kind;
        item.description = description;
        item.productRef = productRef;
        item.customType = customType;
        item.quantity = quantity;
        item.unitPrice = unitPrice;
        item.amount = Math.multiplyExact(quantity, unitPrice);
        return item;
    }
}
