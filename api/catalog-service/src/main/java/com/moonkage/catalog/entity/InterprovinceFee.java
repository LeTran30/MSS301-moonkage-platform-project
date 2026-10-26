package com.moonkage.catalog.entity;

import java.time.Instant;

public record InterprovinceFee(String provinceCode, long fee, Instant effectiveFrom, String updatedBy) {}
