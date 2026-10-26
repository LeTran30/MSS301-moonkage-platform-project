package com.moonkage.vendor.product.dto.request;

import com.moonkage.vendor.product.ProductStatus;
import jakarta.validation.constraints.NotNull;

/**
 * A change of status: the Shop hides or shows its product (FR-34), an admin removes it with a reason (FR-46).
 *
 * @param removedReason required to remove
 */
public record UpdateProductRequest(
        @NotNull(message = "{validation.required}") ProductStatus status, String removedReason) {}
