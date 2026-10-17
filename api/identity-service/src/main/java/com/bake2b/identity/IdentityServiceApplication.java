package com.bake2b.identity;

import com.bake2b.identity.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class IdentityServiceApplication {
    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
