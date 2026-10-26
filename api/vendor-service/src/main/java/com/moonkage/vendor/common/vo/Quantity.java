package com.moonkage.vendor.common.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.io.Serializable;

/** A number of items, more than 0: a minimum order, where a price tier starts, an amount to reserve. */
public record Quantity(int value) implements Serializable {

    public Quantity {
        if (value <= 0) {
            throw new AppException(ErrorCode.QUANTITY_INVALID);
        }
    }

    /** {@code null} (field left out of a request) is refused like any other invalid quantity. */
    public static Quantity of(Integer value) {
        if (value == null) {
            throw new AppException(ErrorCode.QUANTITY_INVALID);
        }
        return new Quantity(value);
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
