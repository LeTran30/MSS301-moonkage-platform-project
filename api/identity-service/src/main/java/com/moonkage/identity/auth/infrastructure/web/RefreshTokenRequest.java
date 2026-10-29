package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.value.Text;

public record RefreshTokenRequest(String refreshToken) {

    /** Only presence is checked here; whether it is a valid token is the use case's question. */
    String toToken() {
        FieldParser parser = new FieldParser();
        String token = parser.required("refreshToken", "validation.refresh_token", refreshToken, Text::required);
        parser.throwIfRejected();
        return token;
    }

    @Override
    public String toString() {
        return "RefreshTokenRequest[refreshToken=" + Text.HIDDEN + "]";
    }
}
