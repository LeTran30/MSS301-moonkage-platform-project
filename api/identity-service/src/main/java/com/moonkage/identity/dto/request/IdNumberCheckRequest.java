package com.moonkage.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

/** vendor-service asks identity to hash an ID number declared on a seller profile (BR-27, D-07). */
public record IdNumberCheckRequest(
        @NotBlank String accountId, @NotBlank String idNumber) {}
