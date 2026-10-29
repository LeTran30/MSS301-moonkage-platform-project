package com.moonkage.identity.common;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.auth.dto.LoginRequest;
import com.moonkage.identity.auth.dto.LoginResponse;
import com.moonkage.identity.auth.dto.RefreshTokenRequest;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.auth.dto.ResetPasswordRequest;
import com.moonkage.identity.auth.dto.VerifyAccountRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Passwords, OTPs and tokens must not show up when a DTO is logged. */
class SensitiveDtoToStringTest {

    private static final String SECRET = "s3cr3t-value";
    private static final String EMAIL = "user@example.com";

    @Test
    void secretsAreRedactedButOtherFieldsStay() {
        List<Object> dtos = List.of(
                new LoginRequest(EMAIL, SECRET),
                new RefreshTokenRequest(SECRET),
                RegisterAccountRequest.builder()
                        .email(EMAIL)
                        .fullName("A")
                        .password(SECRET)
                        .build(),
                new ResetPasswordRequest(EMAIL, SECRET, SECRET),
                new VerifyAccountRequest(EMAIL, SECRET),
                LoginResponse.builder()
                        .token(SECRET)
                        .refreshToken(SECRET)
                        .email(EMAIL)
                        .build());

        for (Object dto : dtos) {
            String text = dto.toString();
            assertFalse(text.contains(SECRET), text);
            if (!(dto instanceof RefreshTokenRequest)) {
                assertTrue(text.contains(EMAIL), text);
            }
        }
    }
}
