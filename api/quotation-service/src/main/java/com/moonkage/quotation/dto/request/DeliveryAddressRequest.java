package com.moonkage.quotation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Where the order goes; copied into the request.
 *
 * @param provinceCode one of the 34 codes of common-reference Province
 */
public record DeliveryAddressRequest(
        @NotBlank @Size(max = 100) String recipientName,
        @NotBlank @Pattern(regexp = "^0\\d{9}$") String recipientPhone,
        @NotBlank @Size(min = 2, max = 2) String provinceCode,
        @NotBlank @Size(max = 255) String addressDetail) {}
