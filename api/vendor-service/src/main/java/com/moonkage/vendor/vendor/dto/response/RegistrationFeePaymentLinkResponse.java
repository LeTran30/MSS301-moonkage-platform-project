package com.moonkage.vendor.vendor.dto.response;

/**
 * A registration fee payment waiting to be paid (AC-27.4): open paymentUrl to pay on VNPay.
 *
 * @param amount whole VND, the level in effect when the payment was created (AC-53.3)
 */
public record RegistrationFeePaymentLinkResponse(String paymentId, long amount, String paymentUrl) {}
