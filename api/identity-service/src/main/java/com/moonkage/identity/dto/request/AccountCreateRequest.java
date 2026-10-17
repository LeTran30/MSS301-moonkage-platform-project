package com.moonkage.identity.dto.request;

import com.moonkage.identity.util.PhoneNumbers;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** AC-01.1: email (or phone), full name, password. No personal/business choice. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreateRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @Pattern(regexp = PhoneNumbers.PATTERN, message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 72, message = "Mật khẩu từ 8 đến 72 ký tự")
    private String password;
}
