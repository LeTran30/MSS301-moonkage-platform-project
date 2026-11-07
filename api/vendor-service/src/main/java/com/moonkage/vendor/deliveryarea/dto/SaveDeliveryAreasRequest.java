package com.moonkage.vendor.vendor.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Replaces the whole list of provinces the vendor delivers to (FR-28).
 *
 * @param provinceCodes at least one; each a province code of common-reference, e.g. "79"
 */
public record SaveDeliveryAreasRequest(
        @NotNull(message = "{validation.required}") List<String> provinceCodes) {}
