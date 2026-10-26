package com.moonkage.quotation.dto.client;

import java.time.Instant;

/**
 * payment-service POST /internal/payments (docs/architecture/api-db/integration.md).
 *
 * @param purpose DEPOSIT for a quote acceptance
 * @param referenceId the acceptanceId
 * @param expiresAt the deposit must be paid before this; never after the quote's validity
 */
public record CreatePaymentRequest(
        String purpose, String referenceId, String payerAccountId, long amount, Instant expiresAt) {

    public static final String DEPOSIT = "DEPOSIT";

    public static CreatePaymentRequest deposit(
            String acceptanceId, String payerAccountId, long amount, Instant expiresAt) {
        return new CreatePaymentRequest(DEPOSIT, acceptanceId, payerAccountId, amount, expiresAt);
    }
}
