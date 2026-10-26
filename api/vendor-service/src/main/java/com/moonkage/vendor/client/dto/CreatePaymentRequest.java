package com.moonkage.vendor.client.dto;

/**
 * Body of POST /internal/payments.
 *
 * @param referenceId the vendorId for REGISTRATION_FEE
 * @param payerAccountId the account that pays (payments.payer_account_id)
 * @param amount whole VND, fixed when the payment is created (AC-53.3)
 */
public record CreatePaymentRequest(PaymentPurpose purpose, String referenceId, String payerAccountId, long amount) {}
