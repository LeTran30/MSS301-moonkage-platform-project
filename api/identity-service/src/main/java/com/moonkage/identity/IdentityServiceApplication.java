package com.moonkage.identity;

import com.moonkage.identity.common.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class IdentityServiceApplication {
    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
