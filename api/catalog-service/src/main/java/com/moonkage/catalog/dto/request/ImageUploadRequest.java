package com.moonkage.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Step 1 of an image upload: what the client is about to send. The signed upload only accepts this type and at most
 * sizeBytes; both are checked again after the upload.
 */
public record ImageUploadRequest(
        @NotBlank(message = "Loại file không được để trống") String contentType,

        @NotNull(message = "Kích thước file không được để trống") @Positive(message = "Kích thước file phải lớn hơn 0")
        Long sizeBytes) {}
