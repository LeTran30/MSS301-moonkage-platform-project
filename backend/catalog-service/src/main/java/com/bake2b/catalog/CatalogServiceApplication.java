package com.bake2b.catalog;

import com.bake2b.catalog.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class CatalogServiceApplication {

    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(CatalogServiceApplication.class, args);
    }

}
