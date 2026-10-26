package com.moonkage.identity.address.dto;

import java.time.Instant;
import lombok.Builder;

/**
 * One saved delivery address (FR-03).
 *
 * @param fullAddress "detail, ward, province" on one line, ready to show
 * @param areaCode key to filter products and sellers by delivery area (AC-03.2); today the province code (Q-12)
 */
@Builder
public record AddressResponse(
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
