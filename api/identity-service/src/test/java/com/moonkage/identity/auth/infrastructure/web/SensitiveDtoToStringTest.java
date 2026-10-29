package com.moonkage.identity.auth.infrastructure.web;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.shared.Role;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Passwords, OTPs and tokens must not show up when a request or response is logged. */
class SensitiveDtoToStringTest {

    private static final String SECRET = "s3cr3t-value";
    private static final String EMAIL = "user@example.com";

    @Test
    void secretsAreHiddenButOtherFieldsStay() {
        List<Object> dtos = List.of(
                new LoginRequest(EMAIL, SECRET),
                new RegisterAccountRequest(EMAIL, null, "A", SECRET),
                new ResetPasswordRequest(EMAIL, SECRET, SECRET),
                new VerifyAccountRequest(EMAIL, SECRET),
                new LoginResponse(SECRET, SECRET, "id", EMAIL, null, "A", Role.MEMBER));

        for (Object dto : dtos) {
            String text = dto.toString();
            assertFalse(text.contains(SECRET), text);
            assertTrue(text.contains(EMAIL), text);
        }
        assertFalse(new RefreshTokenRequest(SECRET).toString().contains(SECRET));
    }
}
