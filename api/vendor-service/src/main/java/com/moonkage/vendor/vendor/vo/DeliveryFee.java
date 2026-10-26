package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.io.Serializable;

/**
 * Flat fee in whole VND the vendor charges per order delivered inside its delivery areas (FR-28, AC-28.3, BR-30).
 * 0 means free delivery; a vendor that never set it has none, which is not the same as 0.
 */
public record DeliveryFee(long value) implements Serializable {

    public DeliveryFee {
        if (value < 0) {
            throw new AppException(ErrorCode.DELIVERY_FEE_INVALID);
        }
    }

    public static DeliveryFee of(Long value) {
        if (value == null) {
            throw new AppException(ErrorCode.DELIVERY_FEE_INVALID);
        }
        return new DeliveryFee(value);
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
