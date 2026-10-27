package com.moonkage.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Step 1 of an upload (mockup, progress photo, invoice, evidence): what the client is about to send. The signed
 * upload only accepts this type and at most sizeBytes; both are checked again when the file is attached.
 */
public record FileUploadRequest(
        @NotBlank String contentType, @Positive long sizeBytes) {}
