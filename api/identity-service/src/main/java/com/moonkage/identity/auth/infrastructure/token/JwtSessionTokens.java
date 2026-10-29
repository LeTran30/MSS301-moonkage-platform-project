package com.moonkage.identity.auth.infrastructure.token;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Clock;
import java.time.Instant;
import javax.crypto.SecretKey;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * The HS256 tokens of {@code docs/auth.md}. Token mechanics only: it does not load the account, so callers check the
 * account as it is now (a token outlives a password change).
 */
@Component
@EnableConfigurationProperties(JwtProperties.class)
class JwtSessionTokens implements SessionTokens {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey signingKey;
    private final JwtProperties properties;
    private final Clock clock;

    JwtSessionTokens(JwtProperties properties, Clock clock) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret()));
        this.properties = properties;
        this.clock = clock;
    }

    /** Claims of Software Design 8 only: sub (= account id), type, role (access token), iat, exp. */
    @Override
    public Pair issue(AccountView account) {
        Instant now = clock.instant();
        String accessToken = Jwts.builder()
                .subject(account.id().toString())
                .issuedAt(toDate(now))
                .claim(CLAIM_TYPE, TokenType.ACCESS.name())
                .claim(CLAIM_ROLE, account.role().name())
                .expiration(toDate(now.plus(properties.expiration())))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
        String refreshToken = Jwts.builder()
                .subject(account.id().toString())
                .claim(CLAIM_TYPE, TokenType.REFRESH.name())
                .issuedAt(toDate(now))
                .expiration(toDate(now.plus(properties.refreshExpiration())))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
        return new Pair(accessToken, refreshToken);
    }

    @Override
    public Claims readRefreshToken(String refreshToken) {
        return read(refreshToken, TokenType.REFRESH);
    }

    /** Throws TOKEN_EXPIRED, or TOKEN_INVALID for anything else that is not a valid access token of this service. */
    Claims readAccessToken(String accessToken) {
        return read(accessToken, TokenType.ACCESS);
    }

    private Claims read(String token, TokenType expected) {
        io.jsonwebtoken.Claims claims;
        try {
            claims = Jwts.parser()
                    .clock(() -> toDate(clock.instant()))
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new AppException(expected.expired);
        } catch (JwtException | IllegalArgumentException e) {
            throw new AppException(expected.invalid);
        }
        // a 7-day refresh token must never work as an access token, and the other way round
        if (!expected.name().equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new AppException(expected.invalid);
        }
        return new Claims(claims.getSubject(), issuedAt(claims));
    }

    // jjwt only speaks java.util.Date; it stays inside these two methods
    @SuppressWarnings("JavaUtilDate")
    private static java.util.Date toDate(Instant instant) {
        return java.util.Date.from(instant);
    }

    @SuppressWarnings("JavaUtilDate")
    private static Instant issuedAt(io.jsonwebtoken.Claims claims) {
        return claims.getIssuedAt() == null ? null : claims.getIssuedAt().toInstant();
    }

    /** The {@code type} claim, and how a bad token of that type is answered. */
    @SuppressWarnings("ImmutableEnumChecker") // the codes are enum constants, immutable in fact
    private enum TokenType {
        ACCESS(BearerTokenError.TOKEN_EXPIRED, BearerTokenError.TOKEN_INVALID),
        // an expired refresh token is just invalid: the client logs in again either way
        REFRESH(AuthError.REFRESH_TOKEN_INVALID, AuthError.REFRESH_TOKEN_INVALID);

        private final ErrorCode expired;
        private final ErrorCode invalid;

        TokenType(ErrorCode expired, ErrorCode invalid) {
            this.expired = expired;
            this.invalid = invalid;
        }
    }
}
