package com.moonkage.identity.auth.dto;

import com.moonkage.identity.account.atom.PasswordConstant;
import com.moonkage.identity.security.SecurityConstant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.otp.required}") String otp,

        @NotBlank(message = "{validation.new_password.required}")
        @Size(
                min = PasswordConstant.MIN_LENGTH,
                max = PasswordConstant.MAX_LENGTH,
                message = "{validation.password.size}")
        String newPassword) {

    @Override
    public String toString() {
        return "ResetPasswordRequest[email=" + email + ", otp=" + SecurityConstant.REDACTED + ", newPassword="
                + SecurityConstant.REDACTED + "]";
    }
}
