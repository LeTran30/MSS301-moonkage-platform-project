package com.moonkage.quotation.dto.response;

public record DeliveryAddressResponse(
        String recipientName, String recipientPhone, String provinceCode, String addressDetail) {}
