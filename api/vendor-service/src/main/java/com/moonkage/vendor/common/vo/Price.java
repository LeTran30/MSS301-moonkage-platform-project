package com.moonkage.vendor.common.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.io.Serializable;

/** An amount to pay in whole VND, more than 0 (NFR-09): a list price, a price tier, the registration fee. */
public record Price(long value) implements Serializable {

    public Price {
        if (value <= 0) {
            throw new AppException(ErrorCode.PRICE_INVALID);
        }
    }

    /** {@code null} (field left out of a request) is refused like any other invalid amount. */
    public static Price of(Long value) {
        if (value == null) {
            throw new AppException(ErrorCode.PRICE_INVALID);
        }
        return new Price(value);
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
