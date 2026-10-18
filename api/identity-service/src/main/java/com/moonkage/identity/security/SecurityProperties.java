package com.moonkage.identity.security;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    /** Paths reachable without a token. The list lives only in application.yml, key security.public-endpoints. */
    private List<String> publicEndpoints = new ArrayList<>();
}
