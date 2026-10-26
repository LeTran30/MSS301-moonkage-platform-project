package com.moonkage.vendor.registrationfee;

import com.moonkage.vendor.common.vo.Price;
import java.time.Instant;
import java.util.UUID;

/** registration_fee.changed: orchestrator-service writes the audit log (FR-53). */
public record RegistrationFeeChangedEvent(
        String eventId, long previousAmount, long amount, Instant effectiveFrom, String changedBy) {

    static RegistrationFeeChangedEvent of(Price previous, RegistrationFeeConfig config) {
        return new RegistrationFeeChangedEvent(
                UUID.randomUUID().toString(),
                previous.value(),
                config.getAmount().value(),
                config.getEffectiveFrom(),
                config.getCreatedBy());
    }
}
