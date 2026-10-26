package com.moonkage.vendor.vendor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Step 1 of a document upload: what the client is about to send. The signed upload only accepts this type and at
 * most sizeBytes; both are checked again when the profile is submitted.
 */
public record DocumentUploadRequest(
        @NotBlank(message = "{validation.required}") String contentType,
        @Positive(message = "{validation.positive}") long sizeBytes) {}
