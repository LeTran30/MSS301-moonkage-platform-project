package com.moonkage.identity.mapper;

import com.moonkage.identity.constant.AddressConstant;
import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Address;

/** Address → response DTO. */
public final class AddressMapper {

    private AddressMapper() {}

    public static AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .recipientPhone(address.getRecipientPhone())
                .provinceCode(address.getProvinceCode())
                .provinceName(address.getProvinceName())
                .wardName(address.getWardName())
                .detail(address.getDetail())
                .fullAddress(toFullAddress(address))
                .areaCode(address.getAreaCode())
                .label(address.getLabel())
                .isDefault(address.isDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }

    private static String toFullAddress(Address address) {
        return String.join(
                AddressConstant.FULL_ADDRESS_SEPARATOR,
                address.getDetail(),
                address.getWardName(),
                address.getProvinceName());
    }
}
