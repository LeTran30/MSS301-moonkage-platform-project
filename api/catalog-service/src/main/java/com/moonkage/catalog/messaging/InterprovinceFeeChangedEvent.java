package com.moonkage.catalog.messaging;

import com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse;
import java.time.Instant;

/** Proposed consumer contract for the domain key in integration.md; eventId is also the AMQP message id. */
public record InterprovinceFeeChangedEvent(
        String eventId,
        String actorAccountId,
        Instant occurredAt,
        InterprovinceFeeTableResponse before,
        InterprovinceFeeTableResponse after) {}
