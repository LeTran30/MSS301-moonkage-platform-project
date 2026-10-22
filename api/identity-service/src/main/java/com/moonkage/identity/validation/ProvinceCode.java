package com.moonkage.identity.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a string is a 2-digit national code of an official Vietnamese province/city
 * according to {@link com.moonkage.reference.Province#isKnown(String)}.
 */
@Documented
@Constraint(validatedBy = ProvinceCodeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ProvinceCode {

    String message() default "{validation.address.province_code.invalid}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
