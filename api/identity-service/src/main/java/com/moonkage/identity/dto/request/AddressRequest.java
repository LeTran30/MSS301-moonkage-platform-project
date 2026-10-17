package com.moonkage.identity.dto.request;

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

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String detail;

    /** Province/city code (Q-12, demo value), e.g. HCM, HN; same codes as vendor delivery areas. */
    @NotBlank(message = "Mã khu vực không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9_-]{1,20}$", message = "Mã khu vực không hợp lệ")
    private String areaCode;

    /** true = make this the default. null on update keeps the current flag. */
    private Boolean isDefault;
}
