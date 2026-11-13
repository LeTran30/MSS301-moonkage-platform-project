package com.moonkage.payment.service;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.dto.request.CreateDisbursementRequest;
import com.moonkage.payment.dto.request.ReviewDisbursementRequest;
import com.moonkage.payment.dto.response.DisbursementListItemResponse;
import com.moonkage.payment.dto.response.DisbursementResponse;
import com.moonkage.payment.dto.response.LedgerEntryResponse;
import com.moonkage.payment.dto.response.LedgerResponse;
import com.moonkage.payment.dto.response.PayoutResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.enums.DisbursementStatus;
import com.moonkage.payment.security.CurrentUserInfo;
import java.util.List;

/**
 * Root Ledger (payment.md): one ledger per order, read by the vendor's owner and admins, and the three ways money
 * leaves it besides refunds: deposit disbursement (FR-41, FR-47) and payout (FR-48).
 */
public interface ReconciliationService {

    /**
     * Vendor owner: the ledgers of their vendor ({@code vendorId} required). Admin: all, or one vendor's;
     * {@code payableOnly} for the orders waiting for payout (AC-48.1).
     */
    PageResponse<LedgerResponse> list(CurrentUserInfo caller, String vendorId, boolean payableOnly, int page, int size);

    LedgerResponse get(CurrentUserInfo caller, String orderId);

    /** NFR-07: every money movement of the order, read only. */
    List<LedgerEntryResponse> entries(CurrentUserInfo caller, String orderId);

    List<RefundResponse> refunds(CurrentUserInfo caller, String orderId);

    List<DisbursementResponse> disbursements(CurrentUserInfo caller, String orderId);

    /** Direct paged query for admin/vendor screens; does not fan out through every ledger. */
    PageResponse<DisbursementListItemResponse> listDisbursements(
            CurrentUserInfo caller, String vendorId, DisbursementStatus status, int page, int size);

    /** FR-41: the vendor owner asks for part of a custom order's deposit; waiting ones count against what is held. */
    default DisbursementResponse requestDisbursement(
            CurrentUserInfo caller, String orderId, CreateDisbursementRequest request) {
        return requestDisbursement(caller, orderId, request, null);
    }

    DisbursementResponse requestDisbursement(
            CurrentUserInfo caller, String orderId, CreateDisbursementRequest request, String idempotencyKey);

    /** FR-47: an admin approves (the ledger moves) or rejects with a reason. */
    DisbursementResponse reviewDisbursement(
            CurrentUserInfo caller, String orderId, String requestId, ReviewDisbursementRequest request);

    /**
     * FR-48: an admin pays the vendor what is still held, once per order, after order-service locked the order
     * (P-02). Refused while a refund or a disbursement request of the order is pending.
     */
    PayoutResponse payout(CurrentUserInfo caller, String orderId);
}
