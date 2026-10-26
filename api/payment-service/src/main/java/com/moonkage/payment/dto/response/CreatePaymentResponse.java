package com.moonkage.payment.dto.response;

/** @param paymentUrl VNPay page where the payer pays */
public record CreatePaymentResponse(String paymentId, String paymentUrl) {}
