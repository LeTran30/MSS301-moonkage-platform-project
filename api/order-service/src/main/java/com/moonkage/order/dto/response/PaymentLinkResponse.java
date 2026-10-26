package com.moonkage.order.dto.response;

/** @param paymentUrl the VNPay page */
public record PaymentLinkResponse(String paymentId, String paymentUrl) {}
