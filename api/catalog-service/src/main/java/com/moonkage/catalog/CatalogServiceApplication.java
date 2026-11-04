package com.moonkage.catalog;

import com.moonkage.catalog.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * catalog-service is a read model (L-18): it copies the products of vendor-service through the projection and
 * serves them. It never writes a product itself.
 */
@EnableScheduling
@ConfigurationPropertiesScan
@SpringBootApplication
public class CatalogServiceApplication {

    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(CatalogServiceApplication.class, args);
    }
}
