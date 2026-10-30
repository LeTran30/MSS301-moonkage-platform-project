package com.moonkage.identity.address.infrastructure.web;

import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.address.domain.DeliveryLocation;
import com.moonkage.identity.address.domain.Recipient;
import java.time.Instant;

/**
 * One saved delivery address (FR-03).
 *
 * @param recipientPhone the 9 subscriber digits
 * @param fullAddress "detail, ward, province" on one line, ready to show
 * @param areaCode key to filter products and sellers by delivery area (AC-03.2); today the province code (Q-12)
 */
record AddressResponse(
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
        Instant updatedAt) {

    static AddressResponse from(AddressEntry entry) {
        Recipient recipient = entry.contact().recipient();
        DeliveryLocation location = entry.contact().location();
        return new AddressResponse(
                entry.id().toString(),
                recipient.name().value(),
                recipient.phone().value(),
                location.province().code(),
                location.province().officialName(),
                location.ward().value(),
                location.detail().value(),
                location.oneLine(),
                location.area().code(),
                entry.label().map(AddressLabel::value).orElse(null),
                entry.isDefault(),
                entry.getCreatedAt(),
                entry.getUpdatedAt());
    }
}
