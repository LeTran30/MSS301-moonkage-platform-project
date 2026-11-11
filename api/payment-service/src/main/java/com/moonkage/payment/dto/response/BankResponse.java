package com.moonkage.payment.dto.response;

/** A bank of the VietQR list: {@code bin} identifies it in a withdrawal. */
public record BankResponse(String bin, String shortName, String name) {}
