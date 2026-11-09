package com.moonkage.order.dto.response;

import com.moonkage.order.enums.DisputeDecision;
import com.moonkage.order.enums.DisputeParty;
import com.moonkage.order.enums.DisputeReason;
import com.moonkage.order.enums.DisputeStatus;
import java.time.Instant;
import java.util.List;

/**
 * The dispute of an order with both parties' evidence (AC-49.1).
 *
 * @param vendorName the Shop's name on the day of the order; null on older orders
 * @param recipientName who received the order, the name the buyer gave for it
 * @param orderTotalAmount what the buyer paid for the order; a full refund gives it back
 */
public record DisputeResponse(
        String disputeId,
        String orderId,
        String vendorName,
        String recipientName,
        long orderTotalAmount,
        DisputeReason reason,
        String description,
        DisputeStatus status,
        DisputeDecision decision,
        Long refundAmount,
        String decisionReason,
        Instant createdAt,
        Instant resolvedAt,
        List<Evidence> evidences) {

    public record Evidence(DisputeParty party, String downloadUrl, String note, Instant createdAt) {}
}
