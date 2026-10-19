package com.moonkage.identity.dto.response;

import java.time.Instant;
import lombok.Builder;

@Builder
public record AddressResponse(
        String id, String detail, String areaCode, Boolean isDefault, Instant createdAt, Instant updatedAt) {}
