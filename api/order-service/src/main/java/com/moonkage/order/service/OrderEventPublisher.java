package com.moonkage.order.service;

import com.moonkage.order.dto.event.OrderEvent;
import com.moonkage.order.entity.Order;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Writes the order.* events into the outbox, in the transaction that changed the order. */
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final OutboxService outboxService;

    /** Call after the change is flushed, so the event carries the version the order is committed with. */
    public void announce(String routingKey, Order order) {
        OrderEvent event = new OrderEvent(
                UUID.randomUUID().toString(),
                order.getId(),
                order.getKind().name(),
                order.getStatus().name(),
                order.getBuyerAccountId(),
                order.getVendorId(),
                order.getTotalAmount(),
                order.isInterprovince(),
                order.getComplaintDeadline(),
                order.getReceivedConfirmedAt() != null,
                order.getVersion(),
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }
}
