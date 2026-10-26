package com.moonkage.identity.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Body that only carries an email: send-verify-account-otp and send-reset-password-otp. */
public record SendOtpRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email) {}
