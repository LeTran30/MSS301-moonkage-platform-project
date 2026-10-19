package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AccountConstant;
import com.moonkage.identity.constant.SecurityConstant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.otp.required}") String otp,

        @NotBlank(message = "{validation.new_password.required}")
        @Size(
                min = AccountConstant.PASSWORD_MIN_LENGTH,
                max = AccountConstant.PASSWORD_MAX_LENGTH,
                message = "{validation.password.size}")
        String newPassword) {

    @Override
    public String toString() {
        return "ResetPasswordRequest[email=" + email + ", otp=" + SecurityConstant.REDACTED + ", newPassword="
                + SecurityConstant.REDACTED + "]";
    }
}
