package com.moonkage.vendor.common.vo;

import com.moonkage.reference.Province;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.io.Serializable;

/**
 * Code of one of the 34 provinces of Quyết định 19/2025/QĐ-TTg (L-15, A-18), e.g. "79". Only codes of the
 * {@link Province} enum of common-reference exist.
 */
public record ProvinceCode(String value) implements Serializable {

    public ProvinceCode {
        String trimmed = value == null ? null : value.trim();
        if (!Province.isKnown(trimmed)) {
            throw new AppException(ErrorCode.PROVINCE_CODE_INVALID);
        }
        value = trimmed;
    }

    public static ProvinceCode of(String value) {
        return new ProvinceCode(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
