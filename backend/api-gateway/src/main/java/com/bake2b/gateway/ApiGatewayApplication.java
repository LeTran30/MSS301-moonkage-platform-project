package com.bake2b.gateway;

import com.bake2b.gateway.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
