package com.moonkage.vendor.client.dto;

/**
 * POST /internal/accounts/check of identity-service. Carries a full ID number, so {@link #toString()} leaves it out
 * (NFR-03): a logged request never shows it.
 */
public record CheckIdNumberRequest(String accountId, String idNumber) {

    private static final String HIDDEN = "***";

    @Override
    public String toString() {
        return "CheckIdNumberRequest[accountId=" + accountId + ", idNumber=" + HIDDEN + "]";
    }
}
