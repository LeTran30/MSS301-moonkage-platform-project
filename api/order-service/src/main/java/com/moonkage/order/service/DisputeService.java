package com.moonkage.order.service;

import com.moonkage.order.dto.request.EvidenceRequest;
import com.moonkage.order.dto.request.OpenDisputeRequest;
import com.moonkage.order.dto.request.ResolveDisputeRequest;
import com.moonkage.order.dto.response.DisputeResponse;
import com.moonkage.order.dto.response.PayoutLockResponse;
import com.moonkage.order.security.CurrentUserInfo;

/**
 * A dispute lives in its order: it stops the order's money from moving (BR-18) and an order has at most one open
 * (order.md). The payout lock is the other side of the same rule (P-02).
 */
public interface DisputeService {

    /**
     * FR-12: the buyer, after delivery and before the complaint deadline. Refused once payment-service locked the
     * order for payout (P-02).
     */
    DisputeResponse open(CurrentUserInfo caller, String orderId, OpenDisputeRequest request);

    /** AC-49.1: buyer, vendor owner and admin see the latest dispute of the order with both parties' evidence. */
    DisputeResponse get(CurrentUserInfo caller, String orderId);

    /** The buyer or the vendor owner adds evidence while the dispute is open (AC-49.1). */
    DisputeResponse addEvidence(CurrentUserInfo caller, String orderId, EvidenceRequest request);

    /** FR-49: the admin decides; payment-service refunds from what it holds (dispute.resolved). */
    DisputeResponse resolve(CurrentUserInfo caller, String orderId, ResolveDisputeRequest request);

    /**
     * P-02, for payment-service before a payout: locks the order if it may be paid out (received, or past the
     * complaint deadline, and no open dispute). Calling again answers the same lock.
     */
    PayoutLockResponse lockForPayout(String orderId);
}
