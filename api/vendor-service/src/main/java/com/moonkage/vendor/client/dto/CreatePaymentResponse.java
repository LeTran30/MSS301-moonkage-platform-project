package com.moonkage.vendor.client.dto;

/** @param paymentUrl VNPay page where the payer pays */
public record CreatePaymentResponse(String paymentId, String paymentUrl) {}
