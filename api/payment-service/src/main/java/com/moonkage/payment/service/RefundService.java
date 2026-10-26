package com.moonkage.payment.service;

import com.moonkage.payment.dto.request.RefundRequest;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.security.CurrentUserInfo;
import java.util.List;

/**
 * Money back to a payer (AC-49.3, P-01, P-03). A refund is recorded PENDING, then the refund job asks VNPay; when VNPay
 * refuses it waits for an admin as MANUAL_REQUIRED. The ledger moves only once the money went back.
 */
public interface RefundService {

    /** A whole payment back, once per payment and reason; in the caller's transaction. */
    void requestAutomatic(String paymentId, RefundReason reason, long amount);

    /** POST /internal/refunds from order (LATE_PAYMENT) or quotation (QUOTE_EXPIRED). */
    void requestForPayment(RefundRequest request);

    /** dispute.resolved with a refund (FR-49); through the latest payment of the order. Once per dispute. */
    void requestForDispute(String orderId, String disputeId, long amount);

    /**
     * Sends the PENDING refunds to VNPay.
     *
     * @return how many were handled
     */
    int processPending();

    List<RefundResponse> listForOrder(String orderId);

    /** Admin: refunds by status, e.g. MANUAL_REQUIRED (AC-49.3). */
    PageResponse<RefundResponse> list(RefundStatus status, int page, int size);

    /** Admin refunded by hand: MANUAL_REQUIRED becomes SUCCEEDED and the ledger moves. */
    RefundResponse confirmManual(CurrentUserInfo caller, String refundId);
}
