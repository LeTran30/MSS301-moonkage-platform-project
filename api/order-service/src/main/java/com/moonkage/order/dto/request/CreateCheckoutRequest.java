package com.moonkage.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * POST /api/checkouts: pay the whole cart once (FR-09, BR-29). The delivery address is one of the buyer's saved
 * addresses (identity-service), sent as it is shown; it is copied into the checkout and its orders (BR-19).
 *
 * @param provinceCode Q-12, decides the delivery fee of each Shop (BR-30)
 * @param invoiceInfo null = personal invoice (AC-24.5); copied to every order of the checkout (BR-29)
 */
public record CreateCheckoutRequest(
        @NotBlank @Size(max = 100) String recipientName,
        @NotBlank @Pattern(regexp = "0\\d{9}") String recipientPhone,
        @NotBlank @Pattern(regexp = "\\d{2}") String provinceCode,
        @NotBlank @Size(max = 255) String addressDetail,
        @Valid InvoiceInfoRequest invoiceInfo) {

    /** FR-24: only the tax code's format is checked (AC-24.3). */
    public record InvoiceInfoRequest(
            @NotBlank @Size(max = 255) String name,

            @NotBlank @Pattern(regexp = "\\d{10}(-\\d{3})?|\\d{12}")
            String taxCode,

            @NotBlank @Size(max = 255) String address,
            @NotBlank @Email @Size(max = 255) String email) {}
}
