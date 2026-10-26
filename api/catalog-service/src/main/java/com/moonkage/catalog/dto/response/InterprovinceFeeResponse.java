package com.moonkage.catalog.dto.response;

import java.time.Instant;

/** A null fee means not configured, never free delivery. */
public record InterprovinceFeeResponse(String provinceCode, String provinceName, Long fee, Instant effectiveFrom) {}
