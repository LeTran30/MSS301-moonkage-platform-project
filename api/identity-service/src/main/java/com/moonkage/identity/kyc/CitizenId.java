package com.moonkage.identity.kyc;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.io.Serializable;
import java.util.regex.Pattern;

/**
 * Value Object representing a 12-digit Vietnamese Citizen Identity Card number (CCCD gắn chip).
 * Self-validating with masked representation.
 */
public record CitizenId(String value) implements Serializable {

    public static final int LENGTH = 12;
    private static final int MASK_VISIBLE_DIGITS = 4;
    private static final int PROVINCE_CODE_DIGITS = 3;
    private static final Pattern PATTERN = Pattern.compile("^\\d{12}$");

    public CitizenId {
        if (value == null || value.isBlank()) {
            throw new AppException(LegacyError.ID_NUMBER_INVALID);
        }
        value = value.trim();
        if (!PATTERN.matcher(value).matches()) {
            throw new AppException(LegacyError.ID_NUMBER_INVALID);
        }
    }

    public static CitizenId of(String value) {
        return new CitizenId(value);
    }

    public static boolean isValid(String value) {
        return value != null && PATTERN.matcher(value.trim()).matches();
    }

    public String masked() {
        return "********" + value.substring(LENGTH - MASK_VISIBLE_DIGITS);
    }

    public String provinceCode() {
        return value.substring(0, PROVINCE_CODE_DIGITS);
    }

    @Override
    public String toString() {
        return masked();
    }
}
