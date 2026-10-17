package com.moonkage.identity.dto.response;

import com.moonkage.identity.entity.Address;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {

    private String id;
    private String detail;
    private String areaCode;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AddressResponse from(Address address) {
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
