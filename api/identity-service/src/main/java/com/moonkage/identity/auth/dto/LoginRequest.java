package com.moonkage.identity.auth.dto;

import com.moonkage.identity.platform.web.validation.RequestText;
import com.moonkage.identity.security.SecurityConstant;
import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for user login.
 *
 * @param username email or phone number (FR-02)
 * @param password raw password
 */
public record LoginRequest(
        @NotBlank(message = "{validation.username.required}")
        String username,

        @NotBlank(message = "{validation.password.required}")
        String password) {

    /** The identifier is cleaned; the password is kept as typed. */
    public LoginRequest {
        username = RequestText.trim(username);
    }

    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=" + SecurityConstant.REDACTED + "]";
    }
}
