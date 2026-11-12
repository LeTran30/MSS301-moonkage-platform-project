package com.moonkage.vendor.product;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Batch size for hiding products whose printed expiry date has passed. */
@Validated
@ConfigurationProperties("vendor.product-expiry")
record ProductExpiryProperties(@Positive int sweepBatchSize) {}
