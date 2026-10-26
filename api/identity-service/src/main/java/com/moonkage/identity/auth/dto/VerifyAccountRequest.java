package com.moonkage.identity.auth.dto;

import com.moonkage.identity.security.SecurityConstant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyAccountRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.otp.required}") String otp) {

    @Override
    public String toString() {
        return "VerifyAccountRequest[email=" + email + ", otp=" + SecurityConstant.REDACTED + "]";
    }
}
