package com.moonkage.vendor.cakeattribute.dto;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import jakarta.validation.constraints.NotNull;

/**
 * A new crust or filling (AC-54.1); the code and the position are given by the service.
 *
 * @param label the name shown to sellers and buyers, checked by CakeAttributeLabel
 */
public record CreateCakeAttributeRequest(
        @NotNull(message = "{validation.required}") CakeAttributeGroup group, String label) {}
