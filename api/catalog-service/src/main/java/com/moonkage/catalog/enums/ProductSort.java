package com.moonkage.catalog.enums;

import java.util.Arrays;
import java.util.Optional;

/** Orders of the public product list (M2.0, FR-06); {@code param} is the value of the sort query parameter. */
public enum ProductSort {
    RATING("rating"),
    PRICE_ASC("price-asc"),
    PRICE_DESC("price-desc"),
    NEWEST("newest");

    private final String param;

    ProductSort(String param) {
        this.param = param;
    }

    public String param() {
        return param;
    }

    public static Optional<ProductSort> fromParam(String value) {
        return Arrays.stream(values()).filter(sort -> sort.param.equals(value)).findFirst();
    }
}
