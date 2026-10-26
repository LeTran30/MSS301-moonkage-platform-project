package com.moonkage.vendor.vendor.dto.request;

import com.moonkage.vendor.vendor.DocumentKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Admin attaches the registration fee invoice once the fee is paid (Q-36, AC-27.6).
 *
 * @param kind only FEE_INVOICE; the owner's documents come with the profile
 * @param objectKey tempKey from POST /api/vendors/uploads
 */
public record CreateVendorDocumentRequest(
        @NotNull(message = "{validation.required}") DocumentKind kind,
        @NotBlank(message = "{validation.required}") String objectKey) {}
