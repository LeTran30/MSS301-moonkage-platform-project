package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AccountConstant;
import com.moonkage.identity.constant.PhoneConstant;
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

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    private String email;

    @Pattern(regexp = PhoneConstant.PATTERN, message = "{validation.phone.invalid}")
    private String phoneNumber;

    @NotBlank(message = "{validation.full_name.required}")
    @Size(max = AccountConstant.MAX_FULL_NAME_LENGTH, message = "{validation.full_name.too_long}")
    private String fullName;

    @NotBlank(message = "{validation.password.required}")
    @Size(
            min = AccountConstant.PASSWORD_MIN_LENGTH,
            max = AccountConstant.PASSWORD_MAX_LENGTH,
            message = "{validation.password.size}")
    private String password;
}
