package com.moonkage.vendor.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Step 1 of a product image upload: what the client is about to send. The signed upload only accepts this type and
 * at most sizeBytes; both are checked again when the product is saved.
 */
public record ProductImageUploadRequest(
        @NotBlank(message = "{validation.required}") String contentType,
        @Positive(message = "{validation.positive}") long sizeBytes) {}
