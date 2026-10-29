package com.moonkage.identity.security;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Signs and parses the HS256 tokens of {@code docs/auth.md}. Token mechanics only: it does not load the account,
 * so callers check the account's current state themselves (a token outlives a ban).
 */
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    // jjwt's builder only accepts java.util.Date; keep it confined to this adapter
    @SuppressWarnings("JavaUtilDate")
    private static java.util.Date toDate(Instant instant) {
        return java.util.Date.from(instant);
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    /** Claims of Software Design 8 only: sub (= accountId), type, role, plus iat / exp. */
    public String createAccessToken(AccountView account) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(account.id().toString())
                .issuedAt(toDate(now))
                .claim(SecurityConstant.CLAIM_TYPE, SecurityConstant.TOKEN_TYPE_ACCESS)
                .claim(SecurityConstant.CLAIM_ROLE, account.role().name())
                .expiration(toDate(now.plusMillis(expirationMs)))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String createRefreshToken(AccountView account) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(account.id().toString())
                .claim(SecurityConstant.CLAIM_TYPE, SecurityConstant.TOKEN_TYPE_REFRESH)
                .issuedAt(toDate(now))
                .expiration(toDate(now.plusMillis(refreshExpirationMs)))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    /** Claims of a valid access token; refresh tokens are rejected. */
    public JwtClaims parseAccessToken(String token) {
        return parse(token, SecurityConstant.TOKEN_TYPE_ACCESS);
    }

    /** Claims of a valid refresh token; access tokens are rejected. */
    public JwtClaims parseRefreshToken(String token) {
        return parse(token, SecurityConstant.TOKEN_TYPE_REFRESH);
    }

    @SuppressWarnings("JavaUtilDate")
    private static Instant issuedAt(Claims claims) {
        return claims.getIssuedAt() == null ? null : claims.getIssuedAt().toInstant();
    }

    private JwtClaims parse(String token, String expectedType) {
        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new AppException(
                    SecurityConstant.TOKEN_TYPE_REFRESH.equals(expectedType)
                            ? LegacyError.REFRESH_TOKEN_INVALID
                            : LegacyError.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new AppException(
                    SecurityConstant.TOKEN_TYPE_REFRESH.equals(expectedType)
                            ? LegacyError.REFRESH_TOKEN_INVALID
                            : LegacyError.TOKEN_INVALID);
        }
        // a 7-day refresh token must never work as an access token (and vice versa)
        if (!expectedType.equals(claims.get(SecurityConstant.CLAIM_TYPE, String.class))) {
            throw new AppException(
                    SecurityConstant.TOKEN_TYPE_REFRESH.equals(expectedType)
                            ? LegacyError.REFRESH_TOKEN_INVALID
                            : LegacyError.TOKEN_INVALID);
        }
        return new JwtClaims(claims.getSubject(), issuedAt(claims));
    }
}
