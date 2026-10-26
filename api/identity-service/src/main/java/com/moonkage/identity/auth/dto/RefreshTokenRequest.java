package com.moonkage.identity.auth.dto;

import com.moonkage.identity.security.SecurityConstant;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "{validation.refresh_token.required}")
        String refreshToken) {

    @Override
    public String toString() {
        return "RefreshTokenRequest[refreshToken=" + SecurityConstant.REDACTED + "]";
    }
}
