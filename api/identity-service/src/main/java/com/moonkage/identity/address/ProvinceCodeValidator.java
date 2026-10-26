package com.moonkage.identity.address;

import com.moonkage.reference.Province;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Checks a province code against the national reference list (Quyết định 19/2025/QĐ-TTg).
 * Null or blank values are considered valid; use {@code @NotBlank} if required.
 */
public class ProvinceCodeValidator implements ConstraintValidator<ProvinceCode, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        return Province.isKnown(value);
    }
}
