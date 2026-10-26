package com.moonkage.quotation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Business invoice details (FR-24, BR-07): only the tax code format is checked. */
public record InvoiceInfoRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Pattern(regexp = "^\\d{10}(-\\d{3})?$") String taxCode,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Email @Size(max = 255) String email) {}
