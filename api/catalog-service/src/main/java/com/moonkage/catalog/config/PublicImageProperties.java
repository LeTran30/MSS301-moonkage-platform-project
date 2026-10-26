package com.moonkage.catalog.config;

import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.util.UriComponentsBuilder;

/** Read-side URL rendering needs no storage credentials or MinIO network calls. */
@Validated
@ConfigurationProperties(prefix = "catalog.public-images")
public record PublicImageProperties(
        @DefaultValue("http://localhost:9000") URI baseUrl,
        @DefaultValue("moonkage-public") @NotBlank String bucket) {
    public PublicImageProperties {
        if (baseUrl == null
                || baseUrl.getHost() == null
                || !("http".equals(baseUrl.getScheme()) || "https".equals(baseUrl.getScheme()))) {
            throw new IllegalArgumentException("Public image base URL must be HTTP(S)");
        }
    }

    public String toPublicUrl(String key) {
        return UriComponentsBuilder.fromUri(baseUrl)
                .pathSegment(bucket)
                .pathSegment(key.split("/"))
                .build()
                .encode()
                .toUriString();
    }
}
