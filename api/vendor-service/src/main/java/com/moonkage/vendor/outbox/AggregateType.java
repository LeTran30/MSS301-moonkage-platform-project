package com.moonkage.vendor.outbox;

/** Whose state an enveloped event carries; with the aggregate id it names one version stream. */
public enum AggregateType {
    VENDOR,
    PRODUCT
}
