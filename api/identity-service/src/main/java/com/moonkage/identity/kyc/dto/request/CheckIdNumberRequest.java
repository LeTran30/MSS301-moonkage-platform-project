package com.moonkage.identity.kyc.dto.request;

import com.moonkage.identity.platform.web.validation.RequestText;
import jakarta.validation.constraints.NotBlank;

/**
 * vendor-service asks identity to hash an ID number declared on a seller profile (BR-27, D-07).
 *
 * @param idNumber as the seller typed it; separators such as spaces and dashes are dropped here
 */
public record CheckIdNumberRequest(
        @NotBlank String accountId, @NotBlank String idNumber) {

    public CheckIdNumberRequest {
        accountId = RequestText.trim(accountId);
        idNumber = RequestText.digitsOnly(idNumber);
    }
}
