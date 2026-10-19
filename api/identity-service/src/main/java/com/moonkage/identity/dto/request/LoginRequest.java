package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.SecurityConstant;
import jakarta.validation.constraints.NotBlank;

/** @param username email or phone number (FR-02) */
public record LoginRequest(
        @NotBlank(message = "{validation.username.required}")
        String username,

        @NotBlank(message = "{validation.password.required}")
        String password) {

    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=" + SecurityConstant.REDACTED + "]";
    }
}
