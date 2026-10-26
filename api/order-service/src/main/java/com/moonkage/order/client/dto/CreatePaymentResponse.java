package com.moonkage.order.client.dto;

/** @param paymentUrl VNPay page where the buyer pays */
public record CreatePaymentResponse(String paymentId, String paymentUrl) {}
