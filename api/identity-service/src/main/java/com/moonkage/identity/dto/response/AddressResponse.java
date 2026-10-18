package com.moonkage.identity.dto.response;

import java.time.Instant;
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
    private Instant createdAt;
    private Instant updatedAt;
}
