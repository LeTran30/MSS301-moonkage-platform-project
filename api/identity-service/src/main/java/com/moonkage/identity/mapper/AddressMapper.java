package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Address;

/** Entity → DTO for addresses. DTOs must not depend on entities (ArchitectureTest). */
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
