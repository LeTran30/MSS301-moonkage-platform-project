package com.moonkage.catalog.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** catalog.projections: how the captured inbox is applied to the read model. */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "catalog.projections")
public class CatalogProjectionProperties {

    /** Pending inbox events read per page; each event is applied in its own transaction. */
    @Min(1)
    @Max(1000)
    private int applyBatchSize = 100;

    /** Pages one run goes through at most, so a run always ends. */
    @Min(1)
    private int applyMaxPages = 10;
}
