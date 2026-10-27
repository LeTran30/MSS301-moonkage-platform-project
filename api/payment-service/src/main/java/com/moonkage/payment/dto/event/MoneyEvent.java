package com.moonkage.payment.dto.event;

import java.time.Instant;

/**
 * Body of refund.completed, refund.manual_required, disbursement.requested, disbursement.reviewed and
 * payout.completed: the money of an order moved or waits for someone (orchestrator notifies and audits, NFR-07).
 *
 * @param orderId null for a refund not tied to an order (late or duplicate payment)
 * @param referenceId the refund, disbursement request or payout
 * @param status the new status of that reference
 * @param actorAccountId the admin or vendor owner who acted; null for the system
 */
public record MoneyEvent(
        String eventId,
        String orderId,
        String vendorId,
        String referenceId,
        long amount,
        String status,
        String reason,
        String actorAccountId,
        Instant occurredAt) {}
