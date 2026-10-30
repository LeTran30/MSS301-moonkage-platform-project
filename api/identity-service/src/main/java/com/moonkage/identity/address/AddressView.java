package com.moonkage.identity.address;

import java.time.Instant;

/**
 * One address as its owner reads it.
 *
 * @param fullAddress detail, ward and province on one line
 * @param areaCode the delivery area of the province
 * @param label null when none
 */
public record AddressView(
        String id,
        String recipientName,
        String recipientPhone,
        String provinceCode,
        String provinceName,
        String wardName,
        String detail,
        String fullAddress,
        String areaCode,
        String label,
        Boolean isDefault,
        Instant createdAt,
        Instant updatedAt) {}
