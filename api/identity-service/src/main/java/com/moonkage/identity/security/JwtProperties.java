package com.moonkage.identity.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * The token settings of identity-service ({@code jwt.*} in application.yml).
 *
 * <p>The three values used to be read one by one with {@code @Value}. They belong to one group — the same Base64
 * HS256 key and the two lifetimes that go with it — so they live together here. The names, the types and the
 * behaviour do not change: {@code jwt.secret} is still required and {@code jwt.expiration} and
 * {@code jwt.refresh-expiration} are still the lifetimes in milliseconds.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /** The Base64 HS256 key, the same one api-gateway and orchestrator-service verify with. */
    private String secret;

    /** How long an access token stays valid, in milliseconds. */
    private long expiration;

    /** How long a refresh token stays valid, in milliseconds. */
    private long refreshExpiration;
}
