package com.moonkage.vendor.registrationfee.dto;

/** @param amount whole VND, more than 0; checked by {@code Price}, the error names this field */
public record ChangeRegistrationFeeRequest(Long amount) {}
