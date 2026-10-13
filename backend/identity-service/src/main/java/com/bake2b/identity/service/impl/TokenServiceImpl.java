package com.bake2b.identity.service.impl;

import com.bake2b.identity.entity.Account;
import com.bake2b.identity.entity.User;
import com.bake2b.identity.repository.AccountRepository;
import com.bake2b.identity.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

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

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    @Override
    public String createToken(Account account, User user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(account.getId())
                .issuedAt(new Date(now))
                .claim(TYPE, ACCESS)
                .claim("role", account.getRole().getRoleName())
                .claim("accountId", account.getId())
                .claim("userId", user.getId())
                .claim("account_verified", Boolean.TRUE.equals(account.getAccountVerified()))
                .expiration(new Date(now + expirationMs))
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public String refreshToken(Account account) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(account.getId())
                .claim(TYPE, REFRESH)
                .claim("accountId", account.getId())
                .issuedAt(new Date(now))
                .expiration(new Date(now + refreshExpirationMs))
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
        Claims claims = Jwts.parser().verifyWith(getSignInKey()).build().parseSignedClaims(token).getPayload();
        // a 7-day refresh token must never work as an access token (and vice versa)
        if (!expectedType.equals(claims.get(TYPE, String.class))) {
            throw new JwtException("Invalid token type");
        }
        return accountRepository.findById(claims.getSubject())
                .orElseThrow(() -> new JwtException("Account not found"));
    }
}
