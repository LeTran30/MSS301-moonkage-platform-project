package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Address;

/** Address → response DTO. */
public final class AddressMapper {

    private AddressMapper() {}

    public static AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .detail(address.getDetail())
                .areaCode(address.getAreaCode())
                .isDefault(address.isDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
