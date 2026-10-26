package com.moonkage.payment.service;

import com.moonkage.payment.dto.event.DisputeEvent;
import com.moonkage.payment.dto.event.OrderEvent;

/** What payment-service keeps from order-service's events (order_snapshots, ledger owner, dispute refunds). */
public interface OrderEventService {

    /** order.created / status_changed / delivered / received_confirmed. Safe to repeat; older versions skipped. */
    void onOrderEvent(String routingKey, OrderEvent event);

    /** dispute.opened: the order's money waits (BR-18). Safe to repeat. */
    void onDisputeOpened(DisputeEvent event);

    /** dispute.resolved: the money may move again; a refund decision becomes a refund (FR-49). Safe to repeat. */
    void onDisputeResolved(DisputeEvent event);
}
