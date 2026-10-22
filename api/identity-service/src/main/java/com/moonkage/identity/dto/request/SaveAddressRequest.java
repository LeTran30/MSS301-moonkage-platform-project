package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AddressConstant;
import com.moonkage.identity.constant.PhoneConstant;
import com.moonkage.identity.validation.ProvinceCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * FR-03: create or replace a delivery address. The client picks the province from the national list
 * and provides the ward as display text (L-15).
 *
 * @param recipientPhone Vietnamese mobile number in any accepted form (0912…, 84912…, +84912…)
 * @param provinceCode 2-digit national code, e.g. 79 for Thành phố Hồ Chí Minh
 * @param detail house number and street
 * @param isDefault true = make this the default. null on update keeps the current flag
 */
@Builder
public record SaveAddressRequest(
        @NotBlank(message = "{validation.address.recipient_name.required}")
        @Size(max = AddressConstant.MAX_RECIPIENT_NAME_LENGTH, message = "{validation.address.recipient_name.too_long}")
        String recipientName,

        @NotBlank(message = "{validation.address.recipient_phone.required}")
        @Pattern(regexp = PhoneConstant.PATTERN, message = "{validation.address.recipient_phone.invalid}")
        String recipientPhone,

        @NotBlank(message = "{validation.address.province_code.required}")
        @ProvinceCode(message = "{validation.address.province_code.invalid}")
        String provinceCode,

        @NotBlank(message = "{validation.address.province_name.required}")
        @Size(
                max = AddressConstant.MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH,
                message = "{validation.address.province_name.too_long}")
        String provinceName,

        @NotBlank(message = "{validation.address.ward_name.required}")
        @Size(
                max = AddressConstant.MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH,
                message = "{validation.address.ward_name.too_long}")
        String wardName,

        @NotBlank(message = "{validation.address.detail.required}")
        @Size(max = AddressConstant.MAX_DETAIL_LENGTH, message = "{validation.address.detail.too_long}")
        String detail,

        @Size(max = AddressConstant.MAX_LABEL_LENGTH, message = "{validation.address.label.too_long}")
        String label,

        Boolean isDefault) {}
