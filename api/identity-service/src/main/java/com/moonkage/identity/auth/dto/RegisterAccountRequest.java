package com.moonkage.identity.auth.dto;

import com.moonkage.identity.account.AccountConstant;
import com.moonkage.identity.account.vo.PhoneNumber;
import com.moonkage.identity.profile.ProfileConstant;
import com.moonkage.identity.security.SecurityConstant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/** AC-01.1: email (or phone), full name, password. No personal/business choice. */
@Builder
public record RegisterAccountRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email,

        @Pattern(regexp = PhoneNumber.REGEX, message = "{validation.phone.invalid}")
        String phoneNumber,

        @NotBlank(message = "{validation.full_name.required}")
        @Size(max = ProfileConstant.MAX_FULL_NAME_LENGTH, message = "{validation.full_name.too_long}")
        String fullName,

        @NotBlank(message = "{validation.password.required}")
        @Size(
                min = AccountConstant.PASSWORD_MIN_LENGTH,
                max = AccountConstant.PASSWORD_MAX_LENGTH,
                message = "{validation.password.size}")
        String password) {

    @Override
    public String toString() {
        return "RegisterAccountRequest[email=" + email + ", phoneNumber=" + phoneNumber + ", fullName=" + fullName
                + ", password=" + SecurityConstant.REDACTED + "]";
    }
}
