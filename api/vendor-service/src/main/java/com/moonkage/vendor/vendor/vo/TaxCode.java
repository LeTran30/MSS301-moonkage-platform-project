package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.io.Serializable;
import java.util.regex.Pattern;

/**
 * Enterprise or household-business code, which is also the tax code (AC-26.1). Accepted forms: 10 digits, 10 digits
 * + "-" + 3 digits for a dependent unit, or a 12-digit personal ID number, which household businesses use as tax code
 * from 01/07/2025. The format is still an open question (completion-plan, question 6). Spaces are removed.
 */
public record TaxCode(String value) implements Serializable {

    private static final Pattern FORMAT = Pattern.compile("^(\\d{10}(-\\d{3})?|\\d{12})$");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public TaxCode {
        if (value == null) {
            throw new AppException(ErrorCode.TAX_CODE_INVALID);
        }
        value = WHITESPACE.matcher(value).replaceAll("");
        if (!FORMAT.matcher(value).matches()) {
            throw new AppException(ErrorCode.TAX_CODE_INVALID);
        }
    }

    public static TaxCode of(String value) {
        return new TaxCode(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
