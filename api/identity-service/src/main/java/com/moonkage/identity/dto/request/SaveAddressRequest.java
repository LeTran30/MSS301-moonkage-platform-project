package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AddressConstant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * FR-03: create or replace a delivery address.
 *
 * @param areaCode province/city code (Q-12, demo value), e.g. HCM, HN; same codes as vendor delivery areas
 * @param isDefault true = make this the default. null on update keeps the current flag
 */
@Builder
public record SaveAddressRequest(
        @NotBlank(message = "{validation.address.detail.required}")
        @Size(max = AddressConstant.MAX_DETAIL_LENGTH, message = "{validation.address.detail.too_long}")
        String detail,

        @NotBlank(message = "{validation.address.area_code.required}")
        @Pattern(regexp = AddressConstant.AREA_CODE_PATTERN, message = "{validation.address.area_code.invalid}")
        String areaCode,

        Boolean isDefault) {}
