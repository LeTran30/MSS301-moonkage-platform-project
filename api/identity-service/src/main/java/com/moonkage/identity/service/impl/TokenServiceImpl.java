package com.moonkage.identity.service.impl;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.User;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private static final String TYPE = "type";
    private static final String ACCESS = "ACCESS";
    private static final String REFRESH = "REFRESH";

    private final AccountRepository accountRepository;

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

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    @Override
    public String createToken(Account account, User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(account.getId())
                .issuedAt(toDate(now))
                .claim(TYPE, ACCESS)
                .claim("role", account.getRole().getRoleName())
                .claim("accountId", account.getId())
                .claim("userId", user.getId())
                .claim("account_verified", Boolean.TRUE.equals(account.getAccountVerified()))
                .expiration(toDate(now.plusMillis(expirationMs)))
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public String refreshToken(Account account) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(account.getId())
                .claim(TYPE, REFRESH)
                .claim("accountId", account.getId())
                .issuedAt(toDate(now))
                .expiration(toDate(now.plusMillis(refreshExpirationMs)))
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public Account getAccountFromToken(String token) {
        return parse(token, ACCESS);
    }

    @Override
    public Account getAccountFromRefreshToken(String token) {
        return parse(token, REFRESH);
    }

    private Account parse(String token, String expectedType) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        // a 7-day refresh token must never work as an access token (and vice versa)
        if (!expectedType.equals(claims.get(TYPE, String.class))) {
            throw new JwtException("Invalid token type");
        }
        return accountRepository.findById(claims.getSubject()).orElseThrow(() -> new JwtException("Account not found"));
    }
}
