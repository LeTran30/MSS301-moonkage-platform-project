package com.moonkage.orchestrator.infrastructure.websocket;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.text.ParseException;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Checks the access token a browser sends on STOMP CONNECT, the same way api-gateway does for HTTP: HS256 with the
 * shared {@code jwt.secret}, not expired, {@code type = ACCESS} (refresh tokens are refused, docs/auth.md).
 */
@Component
public class AccessTokenVerifier {

    static final String CLAIM_TYPE = "type";
    static final String TOKEN_TYPE_ACCESS = "ACCESS";

    private final JWSVerifier verifier;
    private final Clock clock;

    @Autowired
    public AccessTokenVerifier(@Value("${jwt.secret}") String secret) {
        this(secret, Clock.systemUTC());
    }

    AccessTokenVerifier(String secret, Clock clock) {
        try {
            this.verifier = new MACVerifier(Base64.getDecoder().decode(secret));
        } catch (JOSEException | IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET must be a Base64 key of at least 256 bits", e);
        }
        this.clock = clock;
    }

    /** The account id (JWT subject) of a valid access token; empty for anything else. */
    public Optional<String> accountIdOf(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!JWSAlgorithm.HS256.equals(jwt.getHeader().getAlgorithm()) || !jwt.verify(verifier)) {
                return Optional.empty();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            // nimbus speaks java.util.Date; turn it into an Instant right away
            Instant expiresAt = claims.getExpirationTime() == null
                    ? null
                    : claims.getExpirationTime().toInstant();
            if (expiresAt == null || !expiresAt.isAfter(clock.instant())) {
                return Optional.empty();
            }
            if (!TOKEN_TYPE_ACCESS.equals(claims.getStringClaim(CLAIM_TYPE))) {
                return Optional.empty();
            }
            return Optional.ofNullable(claims.getSubject()).filter(subject -> !subject.isBlank());
        } catch (ParseException | JOSEException e) {
            return Optional.empty();
        }
    }
}
