package com.moonkage.vendor.registrationfee.dto;

import java.time.Instant;

/** The registration fee level in effect (AC-26.9, FR-53). */
public record RegistrationFeeConfigResponse(long amount, Instant effectiveFrom) {}
