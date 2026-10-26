package com.moonkage.catalog.config;

import com.moonkage.storage.StorageAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** Archived writer wiring, deliberately not compatible with V2 where its tables no longer exist. */
@Configuration(proxyBeanMethods = false)
@Profile("legacy-writer")
@EntityScan("com.moonkage.catalog.entity")
@EnableJpaRepositories(
        basePackages = "com.moonkage.catalog.repository",
        excludeFilters =
                @ComponentScan.Filter(
                        type = FilterType.REGEX,
                        pattern = "com\\.moonkage\\.catalog\\.repository\\.readmodel\\..*"))
@Import(StorageAutoConfiguration.class)
public class LegacyWriterConfig {}
