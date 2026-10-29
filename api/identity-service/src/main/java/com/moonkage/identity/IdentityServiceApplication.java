package com.moonkage.identity;

import com.moonkage.identity.platform.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
// logins go through AccountApi.verifyCredentials; without this Boot would add an in-memory user with a random password
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class IdentityServiceApplication {
    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
