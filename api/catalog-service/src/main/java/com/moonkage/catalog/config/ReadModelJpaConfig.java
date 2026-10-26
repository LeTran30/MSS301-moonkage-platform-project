package com.moonkage.catalog.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration(proxyBeanMethods = false)
@Profile("!legacy-writer")
@EntityScan("com.moonkage.catalog.entity.readmodel")
@EnableJpaRepositories("com.moonkage.catalog.repository.readmodel")
public class ReadModelJpaConfig {}
