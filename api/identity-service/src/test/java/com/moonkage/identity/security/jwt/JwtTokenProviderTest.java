package com.moonkage.identity.security.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.enums.Role;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtTokenProviderTest {

    private static final String BASE64_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final String ACCOUNT_ID = "acc-001";

    private JwtTokenProvider jwtTokenProvider;
    private Account account;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();

        ReflectionTestUtils.setField(jwtTokenProvider, "secretKey", BASE64_SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshExpirationMs", 604800000L); // 7 days

        account = Account.builder()
                .id(ACCOUNT_ID)
                .email("user@moonkage.vn")
                .role(Role.MEMBER)
                .accountVerified(true)
                .build();
    }

    @Test
    void createAndParseAccessTokenSuccess() {
        String token = jwtTokenProvider.createAccessToken(account);
        assertNotNull(token);

        JwtClaims claims = jwtTokenProvider.parseAccessToken(token);
        assertEquals(ACCOUNT_ID, claims.accountId());
        // iat is what a password reset is compared with (Q-04)
        assertNotNull(claims.issuedAt());
    }

    @Test
    void tokensCarryOnlyTheClaimsOfTheDesign() {
        // Software Design 8 / Q-20: sub (= accountId), type, role; no accountId copy, no account_verified
        assertEquals(
                Set.of("sub", "iat", "type", "role", "exp"), claimNames(jwtTokenProvider.createAccessToken(account)));
        assertEquals(Set.of("sub", "iat", "type", "exp"), claimNames(jwtTokenProvider.createRefreshToken(account)));
    }

    /** Claim names in the (signed, not encrypted) payload: the middle part of the token. */
    private static Set<String> claimNames(String token) {
        String encoded = token.substring(token.indexOf('.') + 1, token.lastIndexOf('.'));
        String payload = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
        Matcher names = Pattern.compile("\"([A-Za-z_]+)\":").matcher(payload);
        Set<String> found = new HashSet<>();
        while (names.find()) {
            found.add(names.group(1));
        }
        return found;
    }

    @Test
    void createAndParseRefreshTokenSuccess() {
        String refreshToken = jwtTokenProvider.createRefreshToken(account);
        assertNotNull(refreshToken);

        assertEquals(
                ACCOUNT_ID, jwtTokenProvider.parseRefreshToken(refreshToken).accountId());
    }

    @Test
    void parseAccessTokenUsingRefreshMethodFails() {
        String accessToken = jwtTokenProvider.createAccessToken(account);
        AppException ex = assertThrows(AppException.class, () -> jwtTokenProvider.parseRefreshToken(accessToken));
        assertEquals(ErrorCode.REFRESH_TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void parseRefreshTokenUsingAccessMethodFails() {
        String refreshToken = jwtTokenProvider.createRefreshToken(account);
        AppException ex = assertThrows(AppException.class, () -> jwtTokenProvider.parseAccessToken(refreshToken));
        assertEquals(ErrorCode.TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void parseMalformedTokenThrowsTokenInvalid() {
        AppException ex =
                assertThrows(AppException.class, () -> jwtTokenProvider.parseAccessToken("invalid.token.structure"));
        assertEquals(ErrorCode.TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void parseExpiredTokenThrowsTokenExpired() {
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", -1000L);
        String expiredToken = jwtTokenProvider.createAccessToken(account);

        AppException ex = assertThrows(AppException.class, () -> jwtTokenProvider.parseAccessToken(expiredToken));
        assertEquals(ErrorCode.TOKEN_EXPIRED, ex.getErrorCode());
    }

    @Test
    void parseExpiredRefreshTokenThrowsRefreshTokenInvalid() {
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshExpirationMs", -1000L);
        String expiredRefreshToken = jwtTokenProvider.createRefreshToken(account);

        AppException ex =
                assertThrows(AppException.class, () -> jwtTokenProvider.parseRefreshToken(expiredRefreshToken));
        assertEquals(ErrorCode.REFRESH_TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    void tokenSignedWithAnotherKeyIsInvalid() {
        String token = jwtTokenProvider.createAccessToken(account);
        ReflectionTestUtils.setField(
                jwtTokenProvider, "secretKey", "5A7134743777217A25432A462D4A614E645267556B58703273357638792F423F");

        AppException ex = assertThrows(AppException.class, () -> jwtTokenProvider.parseAccessToken(token));
        assertEquals(ErrorCode.TOKEN_INVALID, ex.getErrorCode());
    }
}
