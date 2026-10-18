package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AddressConstant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** FR-03: create or replace a delivery address. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequest {

    @NotBlank(message = "{validation.address.detail.required}")
    @Size(max = AddressConstant.MAX_DETAIL_LENGTH, message = "{validation.address.detail.too_long}")
    private String detail;

    /** Province/city code (Q-12, demo value), e.g. HCM, HN; same codes as vendor delivery areas. */
    @NotBlank(message = "{validation.address.area_code.required}")
    @Pattern(regexp = AddressConstant.AREA_CODE_PATTERN, message = "{validation.address.area_code.invalid}")
    private String areaCode;

    /** true = make this the default. null on update keeps the current flag. */
    private Boolean isDefault;
}
