package com.moonkage.orchestrator.infrastructure.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AccessTokenVerifierTest {

    /** Throw-away test key (Base64, 32 bytes), the format of JWT_SECRET. */
    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private static final Instant NOW = Instant.parse("2026-10-19T10:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    private final AccessTokenVerifier verifier = new AccessTokenVerifier(SECRET, CLOCK);

    @Test
    @DisplayName("a valid access token gives its subject, the account id")
    void validAccessTokenGivesAccountId() throws Exception {
        assertThat(verifier.accountIdOf(token(SECRET, "acc-1", "ACCESS", NOW.plus(Duration.ofMinutes(5)))))
                .contains("acc-1");
    }

    @Test
    @DisplayName("refresh, expired, foreign-key and malformed tokens are all refused")
    void everythingElseIsRefused() throws Exception {
        String otherSecret = Base64.getEncoder().encodeToString(new byte[32]);
        Instant later = NOW.plus(Duration.ofMinutes(5));

        assertThat(verifier.accountIdOf(token(SECRET, "acc-1", "REFRESH", later)))
                .isEmpty();
        assertThat(verifier.accountIdOf(token(SECRET, "acc-1", "ACCESS", NOW))).isEmpty();
        assertThat(verifier.accountIdOf(token(otherSecret, "acc-1", "ACCESS", later)))
                .isEmpty();
        assertThat(verifier.accountIdOf(token(SECRET, " ", "ACCESS", later))).isEmpty();
        assertThat(verifier.accountIdOf("not-a-jwt")).isEmpty();
        assertThat(verifier.accountIdOf(null)).isEmpty();
    }

    @Test
    @DisplayName("a missing or short secret is a startup error, not a silent pass")
    void shortSecretFailsFast() {
        assertThatThrownBy(() -> new AccessTokenVerifier(Base64.getEncoder().encodeToString(new byte[8]), CLOCK))
                .isInstanceOf(IllegalStateException.class);
    }

    static String token(String base64Secret, String subject, String type, Instant expiresAt) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                new JWTClaimsSet.Builder()
                        .subject(subject)
                        .claim(AccessTokenVerifier.CLAIM_TYPE, type)
                        // nimbus takes java.util.Date
                        .expirationTime(java.util.Date.from(expiresAt))
                        .build());
        jwt.sign(new MACSigner(Base64.getDecoder().decode(base64Secret)));
        return jwt.serialize();
    }
}
