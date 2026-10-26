package com.moonkage.vendor.product;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * vendor.stock in application.yml. The sweep interval itself is read by {@code @Scheduled} from the yml.
 *
 * @param sweepBatchSize expired checkouts released per run; the rest wait for the next run
 */
@Validated
@ConfigurationProperties("vendor.stock")
record StockProperties(@Positive int sweepBatchSize) {}
