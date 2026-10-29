package com.moonkage.identity.auth.infrastructure.token;

import com.moonkage.identity.shared.value.Text;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Token settings ({@code jwt.*} in application.yml, documented in docs/auth.md). A plain number of a duration is read
 * as milliseconds, as the environment has always given them.
 *
 * @param secret the HS256 key, base64
 * @param expiration lifetime of an access token
 * @param refreshExpiration lifetime of a refresh token
 */
@ConfigurationProperties(prefix = "jwt")
record JwtProperties(String secret, Duration expiration, Duration refreshExpiration) {

    @Override
    public String toString() {
        return "JwtProperties[secret=" + Text.HIDDEN + ", expiration=" + expiration + ", refreshExpiration="
                + refreshExpiration + "]";
    }
}
