package com.moonkage.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** AC-49.1: one file of evidence from the buyer or the vendor. */
public record EvidenceRequest(
        @NotBlank @Size(max = 255) String tempKey,
        @Size(max = 1000) String note) {}
