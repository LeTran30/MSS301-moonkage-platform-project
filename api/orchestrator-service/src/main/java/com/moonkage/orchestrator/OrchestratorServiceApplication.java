package com.moonkage.orchestrator;

import com.moonkage.orchestrator.infrastructure.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class OrchestratorServiceApplication {

    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(OrchestratorServiceApplication.class, args);
    }
}
