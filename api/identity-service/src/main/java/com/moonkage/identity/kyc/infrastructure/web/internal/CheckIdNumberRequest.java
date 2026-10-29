package com.moonkage.identity.kyc.infrastructure.web.internal;

import jakarta.validation.constraints.NotBlank;

/**
 * vendor-service asks identity to hash an ID number declared on a seller profile (BR-27, D-07). Bean Validation stays
 * on this internal request until identity-client takes over its contract (phase 8).
 *
 * @param idNumber as the seller typed it, separators included
 */
record CheckIdNumberRequest(
        @NotBlank String accountId, @NotBlank String idNumber) {

    /** The full number stays out of logs (NFR-03). */
    @Override
    public String toString() {
        return "CheckIdNumberRequest[accountId=" + accountId + "]";
    }
}
