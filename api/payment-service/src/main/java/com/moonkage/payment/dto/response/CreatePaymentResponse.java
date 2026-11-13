package com.moonkage.payment.dto.response;

/** @param paymentUrl VNPay page where the payer pays; null for a wallet payment, already paid */
public record CreatePaymentResponse(String paymentId, String paymentUrl) {}
