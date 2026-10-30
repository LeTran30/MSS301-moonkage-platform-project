package com.moonkage.identity.auth.infrastructure.token;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

class JwtSessionTokensTest {

    static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    static final Duration ACCESS_LIFETIME = Duration.ofHours(1);
    static final Duration REFRESH_LIFETIME = Duration.ofDays(7);

    private static final String OTHER_SECRET = "5A7134743777217A25432A462D4A614E645267556B58703273357638792F423F";
    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");
    private static final AccountView ACCOUNT = new AccountView(
            AccountId.tryParse(ACCOUNT_ID).orElseThrow(),
            Email.parse("user@moonkage.vn"),
            null,
            Role.MEMBER,
            true,
            null);

    private final MovableClock clock = new MovableClock(NOW);
    private final JwtSessionTokens tokens = tokens(SECRET, clock);

    static JwtSessionTokens tokens(String secret, MovableClock clock) {
        return new JwtSessionTokens(new JwtProperties(secret, ACCESS_LIFETIME, REFRESH_LIFETIME), clock);
    }

    @Test
    void bothTokensNameTheAccountAndWhenTheyWereIssued() {
        SessionTokens.Pair pair = tokens.issue(ACCOUNT);

        // iat is what a password reset is compared with (Q-04)
        assertEquals(new SessionTokens.Claims(ACCOUNT_ID, NOW), tokens.readAccessToken(pair.accessToken()));
        assertEquals(new SessionTokens.Claims(ACCOUNT_ID, NOW), tokens.readRefreshToken(pair.refreshToken()));
    }

    @Test
    void tokensCarryOnlyTheClaimsOfTheDesign() {
        SessionTokens.Pair pair = tokens.issue(ACCOUNT);

        // Software Design 8 / Q-20: sub (= account id), type, role; no accountId copy, no account_verified
        assertEquals(Set.of("sub", "iat", "type", "role", "exp"), claimNames(pair.accessToken()));
        assertEquals(Set.of("sub", "iat", "type", "exp"), claimNames(pair.refreshToken()));
    }

    @Test
    void oneTypeNeverWorksAsTheOther() {
        SessionTokens.Pair pair = tokens.issue(ACCOUNT);

        // a 7-day refresh token must never work as an access token
        assertError(BearerTokenError.TOKEN_INVALID, () -> tokens.readAccessToken(pair.refreshToken()));
        assertError(AuthError.REFRESH_TOKEN_INVALID, () -> tokens.readRefreshToken(pair.accessToken()));
    }

    @Test
    void expiredAccessTokenIsExpiredAndExpiredRefreshTokenInvalid() {
        SessionTokens.Pair pair = tokens.issue(ACCOUNT);

        clock.advance(ACCESS_LIFETIME.plusSeconds(1));
        assertError(BearerTokenError.TOKEN_EXPIRED, () -> tokens.readAccessToken(pair.accessToken()));
        tokens.readRefreshToken(pair.refreshToken());

        clock.advance(REFRESH_LIFETIME);
        assertError(AuthError.REFRESH_TOKEN_INVALID, () -> tokens.readRefreshToken(pair.refreshToken()));
    }

    @Test
    void malformedTokenOrAnotherKeyIsInvalid() {
        SessionTokens.Pair foreign = tokens(OTHER_SECRET, clock).issue(ACCOUNT);

        assertError(BearerTokenError.TOKEN_INVALID, () -> tokens.readAccessToken("invalid.token.structure"));
        assertError(BearerTokenError.TOKEN_INVALID, () -> tokens.readAccessToken(foreign.accessToken()));
        assertError(AuthError.REFRESH_TOKEN_INVALID, () -> tokens.readRefreshToken("invalid.token.structure"));
        assertError(AuthError.REFRESH_TOKEN_INVALID, () -> tokens.readRefreshToken(foreign.refreshToken()));
    }

    @Test
    void neitherTokenNorSecretIsPrinted() {
        SessionTokens.Pair pair = tokens.issue(ACCOUNT);

        assertFalse(pair.toString().contains(pair.accessToken()));
        assertFalse(new JwtProperties(SECRET, ACCESS_LIFETIME, REFRESH_LIFETIME)
                .toString()
                .contains(SECRET));
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

    private static void assertError(ErrorCode expected, Executable call) {
        assertEquals(expected, assertThrows(AppException.class, call).getErrorCode());
    }
}
