package com.moonkage.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** @param tempKey from POST /api/orders/uploads, after the file was sent to MinIO */
public record AttachFileRequest(@NotBlank @Size(max = 255) String tempKey) {}
